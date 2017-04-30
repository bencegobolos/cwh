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
      $("#InterruptCode").hide(100);
    } else {
      document.getElementById("ReloadValue").innerHTML = "0x" + decimalToHex(result.result_reload_value, 4) + " ( " + result.result_reload_value + " )";
      document.getElementById("SystemClock").innerHTML = result.system_clock;
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
  modes : [autoReload8Bit],
  interrupt_name : "INT_TIMER0",
  interrupt_flag_delete : "TF0 = 0;"
};

var Timer1 = {
  name : "Timer1",
  clock_sources : [SYSCLK4, SYSCLK12, SYSCLK48],
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
      reloadValue = Math.round(65536 - (timer_clock/divisor)/overflow_frequency);
      if (reloadValue >= 65536 || reloadValue < 0) return no_result;
      goodness = 65536 - reloadValue;
      break;
    case autoReload8Bit:
      reloadValue = Math.round(256 - (timer_clock/divisor)/overflow_frequency);
      if (reloadValue >= 256 || reloadValue < 0) return no_result;
      goodness = 256 - reloadValue;
      break;
    default:
      return no_result;
  }

  return {"reload_value" : reloadValue, "goodness" : goodness, "divisor" : divisor};
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
