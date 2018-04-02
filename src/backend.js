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
              "overflow_frequency" : overflow_frequency,
              "system_clock" : system_clock,
              "timer_module" : timer_module,
              "timer_clock_source" : timer_clock_source,
              "timer_mode" : timer_mode,
              "result_reload_value" : Math.round(result.reload_value),
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

  result_settings.bit_per_sec = calculateRealFrequency(result_settings.result_reload_value, result_settings.system_clock, result_settings.timer_clock_source,result_settings.timer_mode) / 2;
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

function calculateAdc(mcu_name, sysclk, R, max_sampling_time) {

  var minimum_tracking_time = (R / 1000) * 0.00000011 + 0.00000054;
  var sar_multipliers = [2, 4, 8, 16];
  var mcu = getMcu(mcu_list, mcu_name);

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
    // TODO(bgobolos): if minimum tracking time is high (big resistance value) then slow down sar clock.
    var AD0SC = getAD0SC(system_clock);
    var sar_clock = system_clock / (AD0SC + 1);
    var conversion_time = 13 * (1 / sar_clock) + 2 * (1/system_clock);
    for (var j = 0; j < sar_multipliers.length; ++j) {
      var sar_multiplier = sar_multipliers[j];
      var post_tracking_time = getPostTrackingTime(system_clock, sar_clock, sar_multiplier);
      var ptt_plus_conv_time = post_tracking_time + conversion_time;
      // Calculate timer2 usage to drive the ADC module with 10% idling time after conversion (post tracking mode).
      var timer_result = executeTimerOverflow(mcu_name, Math.floor(1/(ptt_plus_conv_time))*0.9, system_clock, TIMER2);
      timer_result.result_frequency = calculateRealFrequency(timer_result.result_reload_value, timer_result.system_clock, timer_result.timer_clock_source,timer_result.timer_mode);

      var idle_time = 1/timer_result.result_frequency - ptt_plus_conv_time;

      if (minimum_tracking_time <= post_tracking_time && ptt_plus_conv_time < max_sampling_time &&
          1/timer_result.result_frequency < max_sampling_time && 1/timer_result.result_frequency >= minimum_tracking_time &&
         timer_result.result_divisor === 1 && idle_time > 0) {
        results.push({
          "system_clock" : system_clock,
          "sar_clock" : sar_clock,
          "ad0sc" : AD0SC,
          "sar_multiplier" : sar_multiplier,
          "post_tracking_time" : post_tracking_time,
          "conversion_time" : conversion_time,
          "minimum_tracking_time" : minimum_tracking_time,
          "overflow_frequency" : timer_result.overflow_frequency,
          "timer_module" : timer_result.timer_module,
          "timer_clock_source" : timer_result.timer_clock_source,
          "timer_mode" : timer_result.timer_mode,
          "result_reload_value" : timer_result.result_reload_value,
          "result_divisor" : timer_result.result_divisor,
          "result_frequency" : timer_result.result_frequency,
          "idle_time" : idle_time
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

/* TODO(bgobolos): use format string instead. */
function get_timer_interrupt_code(timer_setup_result) {
  if (timer_setup_result.result_divisor > 1) {
    return "\
void intHandler(void) __interrupt " + timer_setup_result.timer_module.interrupt_name + " {\n\
    static unsigned char divisor = " + timer_setup_result.result_divisor + ";\n\
    " + timer_setup_result.timer_module.interrupt_flag_delete + "\n\
    divisor--;\n\
    if (!divisor) {\n\
        divisor = " + timer_setup_result.result_divisor + ";\n\n\
        /* Paste your code here. */\n\
        /* This code will be executed at " + timer_setup_result.overflow_frequency + " Hz. */\n\n\
    }\n\
}\n\n";
  } else {
    return "\
void intHandler(void) __interrupt " + timer_setup_result.timer_module.interrupt_name + " {\n\
    " + timer_setup_result.timer_module.interrupt_flag_delete  + "\n\n\
    /* Paste your code here. */\n\
    /* This code will be executed at " + timer_setup_result.overflow_frequency + " Hz. */\n\n\
}\n\n";
  }
}

function get_oscillator_code(result) {
  var sysclk_multiplier = 7 - Math.round(Math.log(24500000/result.system_clock) / Math.log(2));
  return "void Oscillator_Init() {\n    OSCICN = 0x8" + sysclk_multiplier + ";\n}\n\n";
}

function get_timer_code(timer_setup_result) {
  var timer_code = "";

  // Add metadata.
  timer_code += "/* Automatically generated code for setting timer module of C8051F410 MCU. */\n\n";

  // Include header file.
  timer_code += "#include \"C8051F410.h\"\n\n";

  // Timer init.
  timer_code += "\
void Timer_Init() {\n";
  if (timer_setup_result.timer_mode === autoReload8Bit) {
    switch (timer_setup_result.timer_module.name) {
      case TIMER0:
        timer_code += "    " + timer_setup_result.timer_module.control + " = 0x02;\n";
        timer_code += "    TCON = 0x10;\n";
        timer_code += "    " + timer_setup_result.timer_module.high_reg + " = 0x" + decimalToHex(timer_setup_result.result_reload_value, 4).substring(2,4) + ";\n";
        break;
      case TIMER1:
        timer_code += "    " + timer_setup_result.timer_module.control + " = 0x20;\n";
        timer_code += "    TCON = 0x40;\n";
        timer_code += "    " + timer_setup_result.timer_module.high_reg + " = 0x" + decimalToHex(timer_setup_result.result_reload_value, 4).substring(2,4) + ";\n";
        break;
      case TIMER2:
      case TIMER3:
        timer_code += "    " + timer_setup_result.timer_module.control + " = 0x0C;\n";
        // TODO(bgobolos): Support Timer2 and Timer3 8 bit reload mode.
        break;
    }
  } else if (timer_setup_result.timer_mode === autoReload16Bit) {
    switch (timer_setup_result.timer_module.name) {
      case TIMER2:
      case TIMER3:
        timer_code += "    " + timer_setup_result.timer_module.control + " = 0x04;\n";
        timer_code += "    " + timer_setup_result.timer_module.reload_low_reg + " = 0x" + decimalToHex(timer_setup_result.result_reload_value, 4).substring(2,4) + ";\n";
        timer_code += "    " + timer_setup_result.timer_module.reload_high_reg + " = 0x" + decimalToHex(timer_setup_result.result_reload_value, 4).substring(0,2) + ";\n";
        timer_code += "    " + timer_setup_result.timer_module.low_reg + " = 0x" + decimalToHex(timer_setup_result.result_reload_value, 4).substring(2,4) + ";\n";
        timer_code += "    " + timer_setup_result.timer_module.high_reg + " = 0x" + decimalToHex(timer_setup_result.result_reload_value, 4).substring(0,2) + ";\n";
        break;
    }
  }
  switch (timer_setup_result.timer_clock_source) {
    case 1:
      switch (timer_setup_result.timer_module.name) {
        case TIMER0:
          timer_code += "    CKCON = 0x04;\n";
          break;
        case TIMER1:
          timer_code += "    CKCON = 0x08;\n";
          break;
        case TIMER2:
          timer_code += "    CKCON = 0x10;\n";
          break;
        case TIMER3:
          timer_code += "    CKCON = 0x40;\n";
          break;
      }
      break;
    case 4:
      switch (timer_setup_result.timer_module.name) {
        case TIMER0:
        case TIMER1:
          timer_code += "    CKCON = 0x01;\n";
          break;
      }
      break;

    case 12:
      // Default setup, no additional code is necessary.
      break;

    case 48:
      switch (timer_setup_result.timer_module.name) {
        case TIMER0:
        case TIMER1:
          timer_code += "    CKCON = 0x02;\n";
          break;
      }
      break;

    default:
      console.log("Invalid timer clock source. Stopping code generation.");
      return;
  }
  timer_code += "}\n\n";

  // Oscillator init.
  timer_code += get_oscillator_code(timer_setup_result);

  // Interrupt init.
  timer_code += "void Interrupts_Init() {\n    " + timer_setup_result.timer_module.interrupt_enable_bit + "\n}\n\n";

  // Interrupt handler.
  timer_code += get_timer_interrupt_code(timer_setup_result);

  // Device init.
  timer_code += "\
void Init_Device(void) {\n\
    Timer_Init();\n\
    Oscillator_Init();\n\
    Interrupts_Init();\n\
}\n\n";

  // Main.
  timer_code += "\
void main() {\n\
    Init_Device();\n\
    while (1) {\n\n\
        /* Paste your code here. */\n\n\
    }\n\
}\n";

  return timer_code;
}
