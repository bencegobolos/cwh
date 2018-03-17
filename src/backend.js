function executeTimerOverflow(mcu_name, overflow_frequency, sysclk, timer_module_name) {
  /* Executes the algorithm. Returns the optimal setting of MCU.
   Returns: [result_reload_value, result_sysclk, result_timer_clock_source, result_timer_module, result_timer_mode]
   */

  var mcu = getMcu(mcu_list, mcu_name);

  // Optional parameters.
  var system_clocks;
  if (sysclk == -1) {
    system_clocks = mcu.system_clocks;
  } else {
    system_clocks = [sysclk];
  }

  var timer_modules;
  if (timer_module_name == "") {
    timer_modules = mcu.timer_modules;
  } else {
    timer_modules = [mcu.getTimerModule(timer_module_name)];
  }

  // Initialize results array.
  var results = [];

  for (var l = 0; l < system_clocks.length; ++l) {
    var system_clock = system_clocks[l];
    for (var k = 0; k < timer_modules.length; ++k) {
      var timer_module = timer_modules[k];
      var timer_clock_sources = timer_module.clock_sources;
      var timer_modes = timer_module.modes;
      for (var i = 0; i < timer_clock_sources.length; ++i) {
        var timer_clock_source = timer_clock_sources[i];
        var timer_clock_value = calculateTimerClockValue(timer_clock_source, system_clock);
        for (var j = 0; j < timer_modes.length; ++j) {
          var timer_mode = timer_modes[j];
          var result = calculateReloadValue(overflow_frequency, timer_clock_value, timer_mode);
          // Strategy to save the result. Another strategies could go here.
          if (result.reload_value >= 0 && result.divisor < 256) {
            results.push({
              "system_clock" : system_clock,
              "timer_module" : timer_module,
              "timer_clock_source" : timer_clock_source,
              "timer_mode" : timer_mode,
              "result_reload_value" : result.reload_value,
              "result_goodness" : result.goodness,
              "result_divisor" : result.divisor
            });
          }
        }
      }
    }
  }
  var result_settings = _.max(_.first(_.toArray(_.groupBy(results, "result_divisor"))), "result_goodness");
  return result_settings;
}

function calculateReloadValue(overflow_frequency, timer_clock, mode) {
  /* Calculate initial value for timers to result interrupts with overflow_frequency periodicity.
   * overflow_frequency: time between interrupts.
   * timer_clock: clock rate of timer module.
   * mode: select timer's mode.
   ** 0: 16 bit auto reload
   ** 1: 8 bit auto reload
   ** x: etc.
   Returns: [reloadValue, goodness, divisor]
   * reloadValue
   ** The reload value of the register to result interrupts with overflow_frequency periodicity.
   ** -1, if the timer can not generate interrupts with overflow_frequency at timer_clock speed.
   * goodness
   ** A number which value depends on how much step will it take to overflow the timer.
   ** Number.NEGATIVE_INFINITY, if the timer can not generate interrupts with overflow_frequency at timer_clock speed.
   * divisor
   ** A number which divides the timer_clock in order to support overflow_frequency code execution via software-aid.
   ** 1 if the overflow_frequency can be guaranteed without software-aid, positive integer otherwise.
   */
  var reloadValue;
  var divisor;
  var goodness;
  var minimal_frequency;

  // Variable that stores a result which represents that the reload value can not be calculated or is not valid.
  var no_result = {"reload_value" : -1, "goodness" : Number.NEGATIVE_INFINITY, "divisor" : Number.POSITIVE_INFINITY};

  // Overflow frequency is bigger than the maximal solvable frequency (timer_clock).
  if (overflow_frequency > timer_clock) return no_result;

  // Get minimal solvable frequency.
  switch (mode) {
    case autoReload16Bit:
      minimal_frequency = timer_clock / 65536;
      break;
    case autoReload8Bit:
      minimal_frequency = timer_clock / 256;
      break;
  }

  // Get timer_clock divisor.
  // 1: if the overflow_frequency can be guaranteed without software-aid
  // Positive integer: otherwise (software-aid is needed)
  if (overflow_frequency < minimal_frequency) {
    divisor = Math.ceil(minimal_frequency / overflow_frequency);
  } else {
    divisor = 1;
  }

  switch (mode) {
    case autoReload16Bit:
      reloadValue = 65536 - (timer_clock/divisor)/overflow_frequency;
      if (reloadValue >= 65536 || reloadValue < 0) return no_result;
      goodness = 65536 - reloadValue;
      break;
    case autoReload8Bit:
      reloadValue = 256 - (timer_clock/divisor)/overflow_frequency;
      if (reloadValue >= 256 || reloadValue < 0) return no_result;
      goodness = 256 - reloadValue;
      break;
    default:
      return no_result;
  }

  return {"reload_value" : reloadValue, "goodness" : goodness, "divisor" : divisor};
}

// #################################################
// ############# UART configuration ################
// #################################################

function calculateUART(mcu_name, bit_per_sec, sysclk, accuracy) {
  var mcu = getMcu(mcu_list, mcu_name);

  // Optional parameters.
  var system_clocks;
  if (sysclk == -1) {
    system_clocks = -1;
  } else {
    system_clocks = [sysclk];
  }

  var result_settings = executeTimerOverflow(mcu.name, bit_per_sec*2, system_clocks, "Timer1");

  result_settings.bit_per_sec = calculateRealFrequency(Math.round(result_settings.result_reload_value), result_settings.system_clock, result_settings.timer_clock_source,result_settings.timer_mode) / 2;
  result_settings.accuracy = Math.abs((result_settings.bit_per_sec-bit_per_sec)/(result_settings.bit_per_sec+bit_per_sec))*100;

  return result_settings;
}

function calculateRealFrequency(reload_value, sysclk, timer_clock_source, timer_mode) {
  var real_frequency;

  switch (timer_mode) {
    case autoReload16Bit:
      real_frequency = (calculateTimerClockValue(timer_clock_source, sysclk))/(65536-reload_value);
      break;
    case autoReload8Bit:
      real_frequency = (calculateTimerClockValue(timer_clock_source, sysclk))/(256-reload_value);
      break;
    default:
      return -1;
  }

  return real_frequency
}



// #################################################
// ############### ADC calculation #################
// #################################################
/*
 For Post-Tracking and Dual-Tracking Modes,
 the tracking time after the convert start signal is equal to the value determined by the AD0TK bits plus 2
 FCLK cycles. Tracking is immediately followed by a conversion. The ADC0 conversion time is always 13
 SAR clock cycles plus an additional 2 FCLK cycles to start and complete a conversion.
 */

function calculateAdc(mcu, sysclk, R, max_sampling_time) {

  var minimum_track_time = (R / 1000) * 0.00000011 + 0.00000054;
  var sar_multipliers = [2, 4, 8, 16];
  var mcu = getMcu(mcu_list, mcu);

  // Optional parameters.
  var system_clocks;
  if (sysclk == -1) {
    system_clocks = mcu.system_clocks;
  } else {
    system_clocks = [sysclk];
  }
  if (max_sampling_time == 0) {
    max_sampling_time = Math.POSITIVE_INFINITY;
  }

  var results = [];

  for (var l = 0; l < system_clocks.length; ++l) {
    var system_clock = system_clocks[l];
    var AD0SC = getAD0SC(system_clock);
    var sar_clock = system_clock / (AD0SC + 1);
    var conversion_time = 13 * (1 / sar_clock) + 2 * (1/system_clock);
    for (var j = 0; j < sar_multipliers.length; ++j) {
      var sar_multiplier = sar_multipliers[j];
      var post_tracking_time = getPostTrackingTime(system_clock, sar_clock, sar_multiplier);
      if (minimum_track_time <= post_tracking_time && conversion_time+post_tracking_time < max_sampling_time) {
        results.push({
          "system_clock" : system_clock,
          "sar_clock" : sar_clock,
          "ad0sc" : AD0SC,
          "sar_multiplier" : sar_multiplier,
          "post_tracking_time" : post_tracking_time,
          "conversion_time" : conversion_time
        });
      }
    }
  }

  var result_settings = _.max(_.last(_.toArray(_.groupBy(results, "sar_clock"))), "sar_multiplier");

  return result_settings;
}

function getAD0SC(system_clock) {
  /*
   Get AD0SC register value.
   SAR has to be maximized but should not be greater than 3 MHz.
   If the system_clock is less then max_sar_clock, then the return value is always 0.
   */
  var max_sar_clock = 3000000;

  return Math.ceil(system_clock / max_sar_clock) - 1;
}

function getPostTrackingTime(system_clock, sar_clock, sar_multiplier) {
  /*
   Get ADC post tracking time.
   */
  return 2*(1/system_clock) + (sar_multiplier * (1/sar_clock));
}

// #################################################
// ############## Helper functions #################
// #################################################

function decimalToHex(decimal, chars) {
  return (decimal + Math.pow(16, chars)).toString(16).slice(-chars).toUpperCase();
}

function calculateTimerClockValue(timer_clock_source, system_clock) {
  return Math.round(system_clock / timer_clock_source);
}

function getMcu(mcu_list, mcu_name) {
  for (var x in mcu_list) {
    var mcu = mcu_list[x];
    if (mcu.name == mcu_name) {
      return mcu;
    }
  }
  // No mcu has been found with the name: mcu_name.
  return undefined;
}