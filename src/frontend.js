var selected_application = "";



$(document).ready(function(){
  /* This handles the external system clock value option (select or other combo box)
   *  The solution was found here:
   *  http://stackoverflow.com/questions/5650457/html-select-form-with-option-to-enter-custom-value
   *  */
  $("#set_timer_module").click(function(){
    document.getElementById("application_title").innerHTML = timer_application_title;
    show_timer_application_form();
    selected_application = timer_application;
  });

  /* This function is used for the navigation bar. It stops rediricting when an application is selected.
   https://stackoverflow.com/questions/15622100/how-can-i-disable-href-if-onclick-is-executed
   */
  $(".ignore-click").click(function(){
    return false;
  });
/*
  $("body").on('DOMSubtreeModified', "#notification", function() {
    $('#notification').show(0).fadeOut(3000);
  });
*/

  $("#set_uart_module").click(function(){
    document.getElementById("application_title").innerHTML = uart_application_title;
    show_uart_application_form();
    selected_application = uart_application;

    var is_timer1_used = isModuleUsed("C8051F410", "Timer1");

    if (is_timer1_used == 1) {
      notify("Timer 1 module is already in use.", "warning");
      $("#result").hide();
    }
  });

  $("#set_adc_module").click(function(){
    document.getElementById("application_title").innerHTML = adc_application_title;
    show_adc_application_form();
    selected_application = adc_application;
  });
/*
  $("#restrictions_button").click(function(){
    $("#restrictions_div").toggle(500);
  });
*/
  $("#DeleteTimer1Usage").click(function(){
    if (C8051F410.set_modules["Timer1"] == undefined) {
      document.getElementById("DeleteTimer1UsageFeedback").innerHTML = "Could not delete Timer 1 usage: no usages found.";
      $("#DeleteTimer1UsageFeedback").show().delay(3000).hide();
    } else {
      delete C8051F410.set_modules["Timer1"];
      notify("Timer 1 usage has been deleted.", "info");
      $("#DeleteTimer1Usage").hide();
    }
  });

  $("#calculate").click(function(){
    switch (selected_application) {
      case timer_application:
        console.log("Timer application is running...");
        execute_timer_application();
        show_timer_application_result();
        break;

      case uart_application:
        console.log("UART application is running...");
        execute_uart_application();
        show_uart_application_result();
        break;

      case adc_application:
        console.log("ADC application is running...");
        execute_adc_application();
        show_adc_application_result();
        break;

      default:
        console.log("Unknown application, \"Calculate\" button does nothing.");
        break;
    }
  });

  var initialText = $('.editable').val();
  $('.editOption').val(initialText);

  $('#system_clock').change(function(){
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

  $("#adc_max_sampling_frequency").on("change", function () {
    var adc_max_sampling_frequency = document.getElementById("adc_max_sampling_frequency").value;
    document.getElementById("adc_max_sampling_time").value = 1 / adc_max_sampling_frequency;
  });

  $("#adc_max_sampling_time").on("change", function () {
    var adc_max_sampling_time = document.getElementById("adc_max_sampling_time").value;
    document.getElementById("adc_max_sampling_frequency").value = 1 / adc_max_sampling_time;
  });

  $("#adc_r_ext").on("focusout", function () {
    var R = document.getElementById("adc_r_ext").value;
    var minimum_track_time = (R / 1000) * 0.00000011 + 0.00000054;
    notify("ADC minimum tracking time =" + minimum_track_time.toExponential(2) + " sec", "info");
  });
});

function show_timer_application_form() {
  $('#set_timer_module_element').addClass('active');
  $('#set_uart_module_element').removeClass('active');
  $('#set_adc_module_element').removeClass('active');
  $("#result").hide();
  $("#application_div").show();
  $("#timer_overflow_frequency_div").show();
  $("#uart_bit_per_sec_div").hide();
  $("#adc_r_ext_div").hide();
  $("#system_clock_div").show();
  $("#timer_module_div").show();
  $("#uart_accuracy_div").hide();
  $("#adc_max_sampling_div").hide();
}

function show_timer_application_result() {
  $("#result_system_clock_div").show();
  $("#result_timer_reload_value_div").show();
  $("#result_timer_module_div").show();
  $("#result_timer_clock_source_div").show();
  $("#result_timer_mode_div").show();
  $("#result_uart_bit_per_sec_div").hide();
  $("#result_uart_accuracy_div").hide();
  $("#result_adc_tracking_time_div").hide();
  $("#result_adc_conversion_time_div").hide();
  $("#result_adc_ad0sc_div").hide();
  $("#result_adc_sar_multiplier_div").hide();

  $("#result").show();
}

function show_uart_application_form() {
  $('#set_timer_module_element').removeClass('active');
  $('#set_uart_module_element').addClass('active');
  $('#set_adc_module_element').removeClass('active');
  $("#result").hide();
  $("#application_div").show();
  $("#timer_overflow_frequency_div").hide();
  $("#uart_bit_per_sec_div").show();
  $("#adc_r_ext_div").hide();
  $("#system_clock_div").show();
  $("#timer_module_div").hide();
  $("#uart_accuracy_div").show();
  $("#adc_max_sampling_div").hide();
}

function show_uart_application_result() {
  $("#result_system_clock_div").show();
  $("#result_timer_reload_value_div").show();
  $("#result_timer_module_div").show();
  $("#result_timer_clock_source_div").show();
  $("#result_timer_mode_div").show();
  $("#result_uart_bit_per_sec_div").show();
  $("#result_uart_accuracy_div").show();
  $("#result_adc_tracking_time_div").hide();
  $("#result_adc_conversion_time_div").hide();
  $("#result_adc_ad0sc_div").hide();
  $("#result_adc_sar_multiplier_div").hide();
  $("#result_timer_interrupt_code_div").hide();

  $("#result").show();
}

function show_adc_application_form() {
  $('#set_timer_module_element').removeClass('active');
  $('#set_uart_module_element').removeClass('active');
  $('#set_adc_module_element').addClass('active');
  $("#result").hide();
  $("#application_div").show();
  $("#timer_overflow_frequency_div").hide();
  $("#uart_bit_per_sec_div").hide();
  $("#adc_r_ext_div").show();
  $("#system_clock_div").show();
  $("#timer_module_div").hide();
  $("#uart_accuracy_div").hide();
  $("#adc_max_sampling_div").show();
}

function show_adc_application_result() {
  $("#result_system_clock_div").show();
  $("#result_timer_reload_value_div").hide();
  $("#result_timer_module_div").hide();
  $("#result_timer_clock_source_div").hide();
  $("#result_timer_mode_div").hide();
  $("#result_uart_bit_per_sec_div").hide();
  $("#result_uart_accuracy_div").hide();
  $("#result_adc_tracking_time_div").show();
  $("#result_adc_conversion_time_div").show();
  $("#result_adc_ad0sc_div").show();
  $("#result_adc_sar_multiplier_div").show();
  $("#result_timer_interrupt_code_div").hide();

  $("#result").show();
}

function execute_timer_application() {
  var mcu = document.getElementById("MCU").value;
  var overflow_frequency = document.getElementById("timer_overflow_frequency").value;
  var system_clock = document.getElementById("system_clock").value;
  var timer_module = document.getElementById("timer_module").value;

  var result = executeTimerOverflow(mcu, overflow_frequency, system_clock, timer_module);

  if (result.result_reload_value < 0 || result.result_reload_value == undefined) {
    document.getElementById("result_timer_reload_value").innerHTML = "No result.";
    document.getElementById("result_system_clock").innerHTML = "-";
    document.getElementById("result_timer_module").innerHTML = "-";
    document.getElementById("result_timer_clock_source").innerHTML = "-";
    document.getElementById("result_timer_mode").innerHTML = "-";
    $("#save_module_usage").hide();
    $("#result_timer_interrupt_code_div").hide();
  } else {
    document.getElementById("result_timer_reload_value").innerHTML = "0x" + decimalToHex(Math.ceil(result.result_reload_value), 4) + " ( " + Math.ceil(result.result_reload_value) + " )";
    document.getElementById("result_system_clock").innerHTML = result.system_clock + " Hz";
    document.getElementById("result_timer_module").innerHTML = result.timer_module.name;
    document.getElementById("result_timer_clock_source").innerHTML = result.timer_clock_source;
    document.getElementById("result_timer_mode").innerHTML = result.timer_mode;

    if (result.result_divisor > 1) {
      var interrupt_code = get_timer_interrupt_code(result.timer_module.interrupt_name, result.result_divisor, result.timer_module.interrupt_flag_delete);
      document.getElementById("result_timer_interrupt_code").innerHTML = interrupt_code;
      $("#result_timer_interrupt_code_div").show();
    } else {
      $("#result_timer_interrupt_code_div").hide();
    }

    // Save module usage.
    var mcu_obj = getMcu(mcu_list, mcu);
    var is_timer_used = isModuleUsed(mcu, result.timer_module.name);
    if (is_timer_used == 0) {
      saveModuleUsage(mcu_obj, getTimerModule(mcu_obj, result.timer_module.name), result);
    } else {
      if (confirm("Do you want to overwrite the usage of " + result.timer_module.name + "?")) {
        saveModuleUsage(mcu_obj, getTimerModule(mcu_obj, result.timer_module.name), result);
      } else {
        console.log("Keeping usage.");
      }
    }
  }

  $("#result").show();

  $("#save_module_usage").click(function(){
    var mcu_obj = getMcu(mcu_list, mcu);
    var retval = saveModuleUsage(mcu_obj, getTimerModule(mcu_obj, result.timer_module.name), result);
    if (retval == 0) {
      notify("Usage of " + result.timer_module.name + " has been saved.", "info");
      $("#DeleteTimer1Usage").show();
    } else {
      notify("Module " + result.timer_module.name + " is already in use.", "warning");
    }
  });
}

function execute_uart_application() {
  var mcu = document.getElementById("MCU").value;
  var bit_per_sec = document.getElementById("uart_bit_per_sec").value;
  var uart_sysclk = document.getElementById("system_clock").value;
  var uart_accuracy = document.getElementById("uart_accuracy").value;

  var result = calculateUART(mcu, bit_per_sec, uart_sysclk, uart_accuracy);

  var result_bit_per_sec = calculateRealFrequency(Math.round(result.result_reload_value), result.system_clock, result.timer_clock_source,result.timer_mode) / 2;
  var result_accuracy = Math.abs((result_bit_per_sec-bit_per_sec)/(result_bit_per_sec+bit_per_sec))*100;

  var is_timer1_used = isModuleUsed(mcu, "Timer1");

  if (is_timer1_used == 1) {
    notify("Timer 1 module is already in use.", "warning");
    $("#result").hide();
  } else {
    if (result.result_reload_value < 0 || result.result_reload_value == undefined || result_accuracy > uart_accuracy) {
      document.getElementById("result_timer_reload_value").innerHTML = "No result.";
      document.getElementById("result_system_clock").innerHTML = "-";
      document.getElementById("result_timer_module").innerHTML = "-";
      document.getElementById("result_timer_clock_source").innerHTML = "-";
      document.getElementById("result_timer_mode").innerHTML = "-";
      document.getElementById("result_uart_bit_per_sec").innerHTML = "-";
      document.getElementById("result_uart_accuracy").innerHTML = "-";
    } else {
      document.getElementById("result_timer_reload_value").innerHTML = "0x" + decimalToHex(Math.ceil(result.result_reload_value), 4) + " ( " + Math.ceil(result.result_reload_value) + " )";
      document.getElementById("result_system_clock").innerHTML = result.system_clock + " Hz";
      document.getElementById("result_timer_module").innerHTML = result.timer_module.name;
      document.getElementById("result_timer_clock_source").innerHTML = result.timer_clock_source;
      document.getElementById("result_timer_mode").innerHTML = result.timer_mode;
      document.getElementById("result_uart_bit_per_sec").innerHTML = result_bit_per_sec.toFixed(0);
      document.getElementById("result_uart_accuracy").innerHTML = result_accuracy.toFixed(3) + " %";
    }
  }
}

function execute_adc_application() {
  var mcu = document.getElementById("MCU").value;
  var R = document.getElementById("adc_r_ext").value;
  var system_clock = document.getElementById("system_clock").value;
  var max_sampling_time = (1 / document.getElementById("adc_max_sampling_frequency").value);

  var minimum_track_time = (R / 1000) * 0.00000011 + 0.00000054;

  var result = calculateAdc(mcu, system_clock, R, max_sampling_time);

  if (result < 0) {
    notify("All settings result in a lower tracking time than necessary.", "danger");
    document.getElementById("result_system_clock").innerHTML = "-";
    document.getElementById("result_adc_ad0sc").innerHTML = "-";
    document.getElementById("result_adc_sar_multiplier").innerHTML = "-";
  } else {
    document.getElementById("result_system_clock").innerHTML = result.system_clock + " Hz";
    document.getElementById("result_adc_ad0sc").innerHTML = result.ad0sc + " ( " + result.sar_clock + " Hz )";
    document.getElementById("result_adc_sar_multiplier").innerHTML = result.sar_multiplier;
  }

  $("#ResultAdcC8051F410").show();
}

function notify(message, type) {
  var notification_div = $("#notification_div");
  document.getElementById("notification").innerHTML = message;
  notification_div.removeClass();
  notification_div.addClass("alert");
  notification_div.addClass("alert-" + type);
  notification_div.show(0).fadeOut(5000);
}
