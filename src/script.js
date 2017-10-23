// #################################################
// ############## Frontend things ##################
// #################################################
$(document).ready(function(){
  $("#GenerateTimerOverFlow").click(function(){
    $("#SetTimerC8051F410").show(500);
    $("#SetAdcC8051F410").hide(100);
    $("#SetUARTC8051F410").hide(100);
  });

  $("#SetUARTCommunication").click(function(){
    $("#SetUARTC8051F410").show(500);
    $("#SetTimerC8051F410").hide(100);
    $("#SetAdcC8051F410").hide(100);

    var is_timer1_used = isModuleUsed("C8051F410", "Timer1");

    if (is_timer1_used == 1) {
      document.getElementById("UARTIsTimer1Used").innerHTML = "Timer 1 module is already in use.";
      $("#ResultUARTC8051F410").hide(500);
      return;
    }
  });

  $("#SetADC").click(function(){
    $("#SetAdcC8051F410").show(500);
    $("#SetTimerC8051F410").hide(100);
    $("#SetUARTC8051F410").hide(100);
  });

  $("#DeleteTimer1Usage").click(function(){
    if (C8051F410.set_modules["Timer1"] == undefined) {
      document.getElementById("DeleteTimer1UsageFeedback").innerHTML = "Could not delete Timer 1 usage: no usages found.";
      $("#DeleteTimer1UsageFeedback").show(100).delay(3000).hide(100);
    } else {
      delete C8051F410.set_modules["Timer1"];
      document.getElementById("DeleteTimer1UsageFeedback").innerHTML = "Timer 1 usage has been deleted.";
      $("#DeleteTimer1Usage").hide(500);
      $("#DeleteTimer1UsageFeedback").show(100).delay(3000).hide(100);
      $("#UARTIsTimer1Used").hide(100);
    }
  });

  $("#GenerateTimerOverFlowFromRestrictionsLabel").click(function(){
    $("#GenerateTimerOverFlowFromRestrictions").toggle(500);
  });

  $("#SetUARTFromRestrictionsLabel").click(function(){
    $("#SetUARTFromRestrictions").toggle(500);
  });

  $("#SetADCFromRestrictionsLabel").click(function(){
    $("#SetADCFromRestrictions").toggle(500);
  });

  /* This handles the external system clock value option (select or other combo box)
  *  The solution was found here:
  *  http://stackoverflow.com/questions/5650457/html-select-form-with-option-to-enter-custom-value
  *  */
  var initialText = $('.editable').val();
  $('.editOption').val(initialText);

  $('#SYSCLK').change(function(){
    var selected = $('option:selected', this).attr('class');
    var optionText = $('.editable').text();

    if(selected == "editable"){
      $('.editOption').show();
      $('.editOption').keyup(function(){
        var editText = $('.editOption').val();
        $('.editable').val(editText);
        $('.editable').html(editText);
      });

    }else{
      $('.editOption').hide();
    }
  });

  /* Copy of the thing above this.
   * This handles the external system clock value option (select or other combo box)
   *  The solution was found here:
   *  http://stackoverflow.com/questions/5650457/html-select-form-with-option-to-enter-custom-value
   *  */
  var initialText = $('.editable').val();
  $('.editOption').val(initialText);

  $('#UARTSYSCLK').change(function(){
    var selected = $('option:selected', this).attr('class');
    var optionText = $('.editable').text();

    if(selected == "editable"){
      $('.editOption').show();
      $('.editOption').keyup(function(){
        var editText = $('.editOption').val();
        $('.editable').val(editText);
        $('.editable').html(editText);
      });

    }else{
      $('.editOption').hide();
    }
  });

  $("#CalculateReloadValue").click(function(){
    var mcu = document.getElementById("MCU").value;
    var overflow_frequency = document.getElementById("OverflowFrequency").value;
    var sysclk = document.getElementById("SYSCLK").value;
    var timer_module = document.getElementById("TimerModule").value;

    var result = executeTimerOverflow(mcu, overflow_frequency, sysclk, timer_module);

    if (result.result_reload_value < 0 || result.result_reload_value == undefined) {
      document.getElementById("ReloadValue").innerHTML = "No result.";
      document.getElementById("SystemClock").innerHTML = "-";
      document.getElementById("Timer").innerHTML = "-";
      document.getElementById("TimerClockSource").innerHTML = "-";
      document.getElementById("TimerMode").innerHTML = "-";
      $("SetTimerModule").hide();
      $("#InterruptCode").hide(100);
    } else {
      document.getElementById("ReloadValue").innerHTML = "0x" + decimalToHex(Math.ceil(result.result_reload_value), 4) + " ( " + Math.ceil(result.result_reload_value) + " )";
      document.getElementById("SystemClock").innerHTML = result.system_clock + " Hz";
      document.getElementById("Timer").innerHTML = result.timer_module.name;
      document.getElementById("TimerClockSource").innerHTML = result.timer_clock_source;
      document.getElementById("TimerMode").innerHTML = result.timer_mode;
      document.getElementById("TimerInterrupt").innerHTML = result.timer_module.interrupt_name;
      document.getElementById("TimerFlagDelete").innerHTML = result.timer_module.interrupt_flag_delete;
      document.getElementById("TimerInterruptDivisorInit").innerHTML = result.result_divisor;
      document.getElementById("TimerInterruptDivisorReset").innerHTML = result.result_divisor;

      if (result.result_divisor > 1) {
        $("#InterruptCode").show(500);
      } else {
        $("#InterruptCode").hide(100);
      }
    }

    $("#SetTimerModule").show();
    $("#SetTimerModule").click(function(){
      var mcu_obj = getMcu(mcu_list, mcu);
      var retval = saveModuleUsage(mcu_obj, getTimerModule(mcu_obj, result.timer_module.name), result);
      if (retval == 0) {
        document.getElementById("SetTimerModuleFeedback").innerHTML = "Usage of " + result.timer_module.name + " has been saved.";
        $("#SetTimerModuleFeedback").show(100).delay(3000).hide(100);
        $("#DeleteTimer1Usage").show(500);
      } else {
        document.getElementById("SetTimerModuleFeedback").innerHTML = "Module " + result.timer_module.name + " is already in use.";
        $("#SetTimerModuleFeedback").show(100).delay(3000).hide(100);
      }
    });

    $("#ResultTimerC8051F410").show(500);
  });

  $("#SetUART").click(function(){
    var mcu = document.getElementById("MCU").value;
    var bit_per_sec = document.getElementById("bitPerSec").value;
    var uart_sysclk = document.getElementById("UARTSYSCLK").value;
    var uart_accuracy = document.getElementById("UARTAccuracy").value;

    var result = calculateUART(mcu, bit_per_sec, uart_sysclk, uart_accuracy);

    var result_bit_per_sec = calculateRealFrequency(Math.round(result.result_reload_value), result.system_clock, result.timer_clock_source,result.timer_mode) / 2;
    //var result_accuracy = bit_per_sec/result_bit_per_sec;
    var result_accuracy = Math.abs((result_bit_per_sec-bit_per_sec)/(result_bit_per_sec+bit_per_sec))*100;

    var is_timer1_used = isModuleUsed(mcu, "Timer1");

    if (is_timer1_used == 1) {
      document.getElementById("UARTIsTimer1Used").innerHTML = "Timer 1 module is already in use.";
      $("#ResultUARTC8051F410").hide(500);
      return;
    } else {
      if (result.result_reload_value < 0 || result.result_reload_value == undefined || result_accuracy > uart_accuracy) {
        document.getElementById("UARTReloadValue").innerHTML = "No result.";
        document.getElementById("UARTSystemClock").innerHTML = "-";
        document.getElementById("UARTTimer").innerHTML = "-";
        document.getElementById("UARTTimerClockSource").innerHTML = "-";
        document.getElementById("UARTTimerMode").innerHTML = "-";
        document.getElementById("UARTResultBitPerSec").innerHTML = "-";
        document.getElementById("UARTResultAccuracy").innerHTML = "-";
      } else {
        document.getElementById("UARTReloadValue").innerHTML = "0x" + decimalToHex(Math.ceil(result.result_reload_value), 4) + " ( " + Math.ceil(result.result_reload_value) + " )";
        document.getElementById("UARTSystemClock").innerHTML = result.system_clock + " Hz";
        document.getElementById("UARTTimer").innerHTML = result.timer_module.name;
        document.getElementById("UARTTimerClockSource").innerHTML = result.timer_clock_source;
        document.getElementById("UARTTimerMode").innerHTML = result.timer_mode;
        document.getElementById("UARTResultBitPerSec").innerHTML = result_bit_per_sec.toFixed(0);
        document.getElementById("UARTResultAccuracy").innerHTML = result_accuracy.toFixed(3) + " %";
      }
    }

    $("#ResultUARTC8051F410").show(500);
  });

  $("#CalculateADC").click(function(){
    var mcu = document.getElementById("MCU").value;
    var R = document.getElementById("R").value;
    var sysclk = document.getElementById("ADCSYSCLK").value;

    var minimum_track_time = (R / 1000) * 0.00000011 + 0.00000054;
    document.getElementById("minimumTrackingTime").innerHTML = minimum_track_time + " sec";

    var result = calculateAdc(mcu, sysclk, R);

    if (result < 0) {
      document.getElementById("resultTrackingTime").innerHTML = "All settings result in a lower tracking time than necessary.";
      document.getElementById("resultADCSYSCLK").innerHTML = "-";
      document.getElementById("AD0SC").innerHTML = "-";
      document.getElementById("resultSARMultiplier").innerHTML = "-";
    } else {
      document.getElementById("resultTrackingTime").innerHTML = result.post_tracking_time + " sec";
      document.getElementById("resultADCSYSCLK").innerHTML = result.system_clock + " Hz";
      document.getElementById("AD0SC").innerHTML = result.ad0sc + " ( " + result.sar_clock + " Hz )";
      document.getElementById("resultSARMultiplier").innerHTML = result.sar_multiplier;
    }

    $("#ResultAdcC8051F410").show(100);
  });
});

// #################################################
// ############ Constants and objects ##############
// #################################################

/* String constants. */
var SYSCLK = "SYSCLK";
var SYSCLK4 = "SYSCLK4";
var SYSCLK12 = "SYSCLK12";
var SYSCLK48 = "SYSCLK48";
var autoReload8Bit = "autoReload8Bit";
var autoReload16Bit = "autoReload16Bit";

var Timer0 = {
  name : "Timer0",
  clock_sources : [SYSCLK4, SYSCLK12, SYSCLK48],
  modes : [autoReload8Bit],
  interrupt_name : "INT_TIMER0",
  interrupt_flag_delete : "TF0 = 0;"
};

var Timer1 = {
  name : "Timer1",
  clock_sources : [SYSCLK, SYSCLK4, SYSCLK12, SYSCLK48],
  modes : [autoReload8Bit],
  interrupt_name : "INT_TIMER1",
  interrupt_flag_delete : "TF1 = 0;"
};

var Timer2 = {
  name : "Timer2",
  clock_sources : [SYSCLK, SYSCLK12],
  modes : [autoReload16Bit, autoReload8Bit],
  interrupt_name : "INT_TIMER2",
  interrupt_flag_delete : "TF2 = 0;"
};

var Timer3 = {
  name : "Timer3",
  clock_sources : [SYSCLK, SYSCLK12],
  modes : [autoReload16Bit, autoReload8Bit],
  interrupt_name : "INT_TIMER3",
  interrupt_flag_delete : "TMR3CN &= 7F;"
};

/* Object representation of C8051F410. */
var C8051F410 = {
  name : "C8051F410",
  system_clocks : [191406, 382813, 765625, 1531250, 3062500, 6125000, 12250000, 24500000],
  timer_modules : [Timer0, Timer1, Timer2, Timer3],
  set_modules : []
};

/* The objects (C8051F410, Timer0, Timer1, Timer2, Timer3) should be outsourced to .json files.
 If it is possible, we should iterate over the files and get the available mcus, and
 generate this list instead of hard-coding it here.
 */
mcu_list = [C8051F410];

// #################################################
// ########### Timer overflow algorithm ############
// #################################################

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
    timer_modules = [getTimerModule(mcu, timer_module_name)];
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

function calculateUART(mcu_name, bitPerSec, sysclk, accuracy) {
  var mcu = getMcu(mcu_list, mcu_name);

  // Optional parameters.
  var system_clocks;
  if (sysclk == -1) {
    system_clocks = -1;
  } else {
    system_clocks = [sysclk];
  }

  var result_settings = executeTimerOverflow(mcu.name, bitPerSec*2, system_clocks, "Timer1");
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

function calculateAdc(mcu, sysclk, R) {

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

  var results = [];

  for (var l = 0; l < system_clocks.length; ++l) {
    var system_clock = system_clocks[l];
    var AD0SC = getAD0SC(system_clock);
    var sar_clock = system_clock / (AD0SC + 1);
    for (var j = 0; j < sar_multipliers.length; ++j) {
      var sar_multiplier = sar_multipliers[j];
      var post_tracking_time = getPostTrackingTime(system_clock, sar_clock, sar_multiplier);
      if (minimum_track_time <= post_tracking_time) {
        results.push({
          "system_clock" : system_clock,
          "sar_clock" : sar_clock,
          "ad0sc" : AD0SC,
          "sar_multiplier" : sar_multiplier,
          "post_tracking_time" : post_tracking_time
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
  var n;

  // Get division number from timer_clock_source.
  switch (timer_clock_source) {
    case SYSCLK:
      n = 1;
      break;
    case SYSCLK4:
      n = 4;
      break;
    case SYSCLK12:
      n = 12;
      break;
    case SYSCLK48:
      n = 48;
      break;
    default:
      return -1;
  }

  return Math.round(system_clock / n);
}


function getTimerModule(mcu, timer_module_name) {
  for (var x in mcu.timer_modules) {
    var timer_module = mcu.timer_modules[x];
    if (timer_module.name == timer_module_name) {
      return timer_module;
    }
  }
  // No timer module has been found with the name: timer_module_name.
  return undefined;
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


function saveModuleUsage(mcu, module, result) {
  if (mcu.set_modules[module.name] == undefined) {
    mcu.set_modules[module.name] = result;
    return 0;
  } else {
    return -1;
  }
}

function isModuleUsed(mcu, module) {
  var mcu_obj = getMcu(mcu_list, mcu);
  var module_obj = getTimerModule(mcu_obj, module);
  if (mcu_obj.set_modules[module_obj.name] == undefined) {
    // Module is not used
    return 0;
  } else {
    // Module is used.
    return 1;
  }
}
