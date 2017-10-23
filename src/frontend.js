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
