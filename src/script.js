// #################################################
// ############## Frontend things ##################
// #################################################
$(document).ready(function(){
  $("#GenerateTimerOverFlow").click(function(){
    $("#SetTimerC8051F410").show(500);
    $("#SetAdcC8051F410").hide(100);
  });

  $("#SetADC").click(function(){
    $("#SetAdcC8051F410").show(500);
    $("#SetTimerC8051F410").hide(100);
  });

  $("#GenerateTimerOverFlowFromRestrictionsLabel").click(function(){
    $("#GenerateTimerOverFlowFromRestrictions").toggle(500);
  });

  $("#CalculateReloadValue").click(function(){
    var mcu = document.getElementById("MCU").value;
    var overflow_frequency = document.getElementById("OverflowFrequency").value;
    var sysclk = document.getElementById("SYSCLK").value;
    var timer_module = document.getElementById("TimerModule").value;

    var result = executeTimerOverflow(mcu, overflow_frequency, sysclk, timer_module);
    if (result[0] < 0) {
      document.getElementById("ReloadValue").innerHTML = "No result.";
      document.getElementById("Settings").innerHTML = " -,-,-,- ";
    } else {
      document.getElementById("ReloadValue").innerHTML = decimalToHex(result[0], 4) + " ( " + result[0] + " )";
      document.getElementById("Settings").innerHTML = result.slice(1, result.length);
    }

    $("#ResultTimerC8051F410").show(500);
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
  modes : [autoReload8Bit]
};

var Timer1 = {
  name : "Timer1",
  clock_sources : [SYSCLK4, SYSCLK12, SYSCLK48],
  modes : [autoReload8Bit]
};

var Timer2 = {
  name : "Timer2",
  clock_sources : [SYSCLK, SYSCLK12],
  modes : [autoReload16Bit, autoReload8Bit]
};

var Timer3 = {
  name : "Timer3",
  clock_sources : [SYSCLK, SYSCLK12],
  modes : [autoReload16Bit, autoReload8Bit]
};

/* Object representation of C8051F410. */
var C8051F410 = {
  name : "C8051F410",
  system_clocks : [191406, 382813, 765625, 1531250, 3062500, 6125000, 12250000, 24500000],
  timer_modules : [Timer0, Timer1, Timer2, Timer3]
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

  // Initialize result values.
  var result_reload_value_badness = Number.MAX_VALUE;
  var result_reload_value, result_system_clock, result_timer_module, result_timer_clock_source, result_timer_mode;

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
          var reload_value = calculateReloadValue(overflow_frequency, timer_clock_value, timer_mode);
          /* Strategy to save the best setting. Another strategies could go here. This should
             probably go to a function with a parameter. E.g.: optimizeTimer(strategy_type)
             The system_clock will iterate from min to max. If there is a solution with the same
             "badness", then the bigger system_clock will be saved.
             Examples:
             * if (system_clock < result_sysclk && reload_value[1] != Number.MAX_VALUE)
               will save the result with the smallest system clock possible.
             * if (...)
               will save something else.
           */
          if (result_reload_value_badness >= reload_value[1]) {
            /* Save the result in these variables.
             This result have too much variable, there must be a better way to save
             everything in just a few lines (one would be the best).
             */
            result_reload_value_badness = reload_value[1];
            result_reload_value = reload_value[0];
            result_system_clock = system_clock;
            result_timer_clock_source = timer_clock_source;
            result_timer_module = timer_module.name;
            result_timer_mode = timer_mode;
          }
        }
      }
    }
  }

  return [result_reload_value, result_system_clock, result_timer_module, result_timer_clock_source, result_timer_mode];
}

function calculateReloadValue(overflow_frequency, timer_clock, mode) {
  /* Calculate initial value for timers to result interrupts with overflow_frequency periodicity.
     * overflow_frequency: time between interrupts.
     * timer_clock: clock rate of timer module.
     * mode: select timer's mode.
       ** 0: 16 bit auto reload
       ** 1: 8 bit auto reload
       ** x: etc.
     Returns: [reloadValue, badness]
     * reloadValue
     ** The reload value of the register to result interrupts with overflow_frequency periodicity.
     ** -1, if the timer can not generate interrupts with overflow_frequency at timer_clock speed.
     * badness
     ** A number between 0 and 1 depending on how much step will it take to overflow the timer.
     ** Number.MAX_VALUE, if the timer can not generate interrupts with overflow_frequency at timer_clock speed.
  */
  var reloadValue;
  var badness;

  switch (mode) {
    case autoReload16Bit:
      reloadValue = Math.round(65536 - timer_clock/overflow_frequency);
      if (reloadValue >= 65536 || reloadValue < 0) return [-1, Number.MAX_VALUE];
      badness = reloadValue / 65536;
      break;
    case autoReload8Bit:
      reloadValue = Math.round(256 - timer_clock/overflow_frequency);
      if (reloadValue >= 256 || reloadValue < 0) return [-1, Number.MAX_VALUE];
      badness = reloadValue / 256;
      break;
    default:
      return [-1, Number.MAX_VALUE];
  }

  return [reloadValue, badness];
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