/*
  Frontend things.
*/
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
    var overflow_time = document.getElementById("OverflowTime").value;
    var system_clock = document.getElementById("SYSCLK").value;
    var timer_module = document.getElementById("TimerModule").value;

    document.getElementById("ReloadValue").innerHTML = executeTimerOverflow(overflow_time, system_clock, timer_module);

    $("#ResultTimerC8051F410").show(500);
  });
});

/* Object representation of C8051F410.
   Contains the modules infos and helper functions for the applications.
*/
var C8051F410 = {
  id : "C8051F410",
  timer_modules : ["Timer0", "Timer1", "Timer2", "Timer3"],
  timer_clock_sources : ["SYSCLK", "SYSCLK4", "SYSCLK12", "SYSCLK48"],
  timer_modes : ["16bit", "8bit", "13bit"],

  availableTimerClockSources : function(timer_module) {
    switch (timer_module) {
      case this.timer_modules[0]:
      case this.timer_modules[1]:
        return [this.timer_clock_sources[1], this.timer_clock_sources[2], this.timer_clock_sources[3]];
      case this.timer_modules[2]:
      case this.timer_modules[3]:
        return [this.timer_clock_sources[0], this.timer_clock_sources[2]];
      default:
        return 0;
    }
  },

  availableTimerModes : function(timer_module) {
    switch (timer_module) {
      case this.timer_modules[2]:
      case this.timer_modules[3]:
        return [this.timer_modes[0], this.timer_modes[1]];
      default:
        return 0;
    }
  },

  availableTimerModules : function() {
    return this.timer_modules;
  },

  calculateTimerClockValue : function(timer_clock_source, system_clock) {
    var n;

    // Get division number from timer_clock_source.
    switch (timer_clock_source) {
      case this.timer_clock_sources[0]:
        n = 1;
        break;
      case this.timer_clock_sources[1]:
        n = 4;
        break;
      case this.timer_clock_sources[2]:
        n = 12;
        break;
      case this.timer_clock_sources[3]:
        n = 48;
        break;
      default:
        return -1;
    }

    return Math.round(system_clock / n);
  }
};

function executeTimerOverflow(overflow_time, system_clock, timer_module) {
  /* Executes the algorithm. Returns the optimal setting of MCU.
     Returns: [reload_value, timer_module, timer_clock_source, timer_mode]
  */

  // Optional parameters.
  if (system_clock == "") system_clock = 191406;
  if (timer_module == "") timer_module = "Timer2";

  // Initialize result values.
  var result_reload_value = 999999;
  var result_timer_module = "";
  var result_timer_clock_source = 0;
  var result_timer_mode = 0;

  // Get overflow frequency to calculate reload value.
  var overflow_frequency = 1 / overflow_time;

  var timer_clock_sources = C8051F410.availableTimerClockSources(timer_module);
  console.log("Timer module: " + timer_module);
  console.log("Timer clock sources: " + timer_clock_sources);

  var timer_modes = C8051F410.availableTimerModes(timer_module);

  for (var i = 0; i < timer_clock_sources.length; ++i) {
    var timer_clock_source = timer_clock_sources[i];
    console.log("Timer clock source: " + timer_clock_source);
    var timer_clock_value = C8051F410.calculateTimerClockValue(timer_clock_source, system_clock);
    console.log("Timer clock value: " + timer_clock_value);
    for (var j = 0; j < timer_modes.length; ++j){
      var timer_mode = timer_modes[j];
      console.log("Timer mode: " + timer_mode);
      var reload_value = calculateReloadValue(overflow_frequency, timer_clock_value, timer_mode);
      if (result_reload_value > reload_value && reload_value >= 0) {
        result_reload_value = reload_value;
        result_timer_clock_source = timer_clock_source;
        result_timer_module = timer_module;
        result_timer_mode = timer_mode;
      }
    }
  }

  return [result_reload_value, result_timer_module, result_timer_clock_source, result_timer_mode];
}

function calculateReloadValue(overflow_frequency, timer_clock, mode) {
  /* Calculate initial value for timers to result interrupts with overflow_frequency periodicity.
     * overflow_frequency: time between interrupts.
     * timer_clock: clock rate of timer module.
     * mode: select timer's mode.
       ** 0: 16 bit auto reload
       ** 1: 8 bit auto reload
       ** x: etc.
     Returns:
     * The reload value of the register to result interrupts with overflow_frequency periodicity.
     * -1, if the timer can not generate interrupts with overflow_frequency periodicity at timer_clock speed.
  */
  console.log("Calculating reload value...");
  console.log("overflow_frequency: " + overflow_frequency + "\ntimer_clock: " + timer_clock + "\nmode: " + mode);

  var reloadValue;

  switch (mode) {
    case "16bit":
      reloadValue = 65536 - timer_clock/overflow_frequency;
      break;
    case "8bit":
      reloadValue = 256 - timer_clock/overflow_frequency;
      break;
    case "13bit":
      reloadValue = 8192 - timer_clock/overflow_frequency;
      break;
    default:
      return -1;
  }

  return Math.round(reloadValue);
}
