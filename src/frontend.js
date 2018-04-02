$(document).ready(function(){

  $("#set_timer_module").click(function(){
    show_timer_application_form();
  });

  $("#set_uart_module").click(function(){
    show_uart_application_form();
  });

  $("#set_adc_module").click(function(){
    show_adc_application_form();
  });

  $("#timer_application_calculate").click(function(){
    console.log("Timer application is running...");
    execute_timer_application();
  });

  $("#uart_application_calculate").click(function(){
    console.log("Uart application is running...");
    execute_uart_application();
  });

  $("#adc_application_calculate").click(function(){
    console.log("Adc application is running...");
    execute_adc_application();
  });

  $("#adc_max_sampling_frequency").on("change", function () {
    var adc_max_sampling_frequency = document.getElementById("adc_max_sampling_frequency").value;
    document.getElementById("adc_max_sampling_time").value = 1 / adc_max_sampling_frequency;
  });

  $("#adc_max_sampling_time").on("change", function () {
    var adc_max_sampling_time = document.getElementById("adc_max_sampling_time").value;
    document.getElementById("adc_max_sampling_frequency").value = 1 / adc_max_sampling_time;
  });
});

function show_timer_application_form() {
  $("#timer_application_form_div, #uart_application_form_div, #adc_application_form_div").hide();
  $("#timer_application_settings, #uart_application_settings, #adc_application_settings").hide();
  $("#timer_result_placeholder, #timer_result_failure, #timer_result_success").hide();
  $("#timer_result_placeholder").show();
  $("#timer_application_form_div").show();
  $("#timer_application_settings").show();
}

function show_uart_application_form() {
  $("#timer_application_form_div, #uart_application_form_div, #adc_application_form_div").hide();
  $("#timer_application_settings, #uart_application_settings, #adc_application_settings").hide();
  $("#uart_result_placeholder, #uart_result_failure, #uart_result_success").hide();
  $("#uart_result_placeholder").show();
  $("#uart_application_form_div").show();
  $("#uart_application_settings").show();
}

function show_adc_application_form() {
  $("#timer_application_form_div, #uart_application_form_div, #adc_application_form_div").hide();
  $("#timer_application_settings, #uart_application_settings, #adc_application_settings").hide();
  $("#adc_result_placeholder, #adc_result_failure, #adc_result_success").hide();
  $("#adc_result_placeholder").show();
  $("#adc_application_form_div").show();
  $("#adc_application_settings").show();
}

function execute_timer_application() {
  var mcu_name = "C8051F410";
  var overflow_frequency = document.getElementById("timer_overflow_frequency").value;
  var system_clock = document.getElementById("timer_application_system_clock").value;
  var timer_module_name = document.getElementById("timer_application_timer_module").value;

  var result = executeTimerOverflow(mcu_name, overflow_frequency, system_clock, timer_module_name);

  $("#timer_result_placeholder, #timer_result_success, #timer_result_failure").hide();

  if ( result.system_clock > 0 ) {
    document.getElementById("timer_result_timer_reload_value").innerHTML = "0x" + decimalToHex(result.result_reload_value, 4) + " ( " + result.result_reload_value + " )";
    document.getElementById("timer_result_system_clock").innerHTML = result.system_clock + " Hz";
    document.getElementById("timer_result_timer_module").innerHTML = result.timer_module.name;
    document.getElementById("timer_result_timer_clock_source").innerHTML = "SYSCLK / " + result.timer_clock_source;
    document.getElementById("timer_result_timer_mode").innerHTML = result.timer_mode;
    document.getElementById("timer_result_timer_interrupt_code").innerHTML = get_timer_code(result);

    $("#timer_result_success").show();
  } else {
    $("#timer_result_failure").show();
  }
}

function execute_uart_application() {
  var mcu_name = "C8051F410";
  var bit_per_sec = document.getElementById("uart_bit_per_sec").value;
  var uart_sysclk = document.getElementById("uart_application_system_clock").value;
  var uart_accuracy = document.getElementById("uart_accuracy").value;

  var result = calculateUART(mcu_name, bit_per_sec, uart_sysclk, uart_accuracy);

  $("#uart_result_placeholder, #uart_result_success, #uart_result_failure").hide();

  if (result.system_clock > 0) {
    document.getElementById("uart_result_timer_reload_value").innerHTML = "0x" + decimalToHex(result.result_reload_value, 4) + " ( " + result.result_reload_value + " )";
    document.getElementById("uart_result_system_clock").innerHTML = result.system_clock + " Hz";
    document.getElementById("uart_result_timer_module").innerHTML = result.timer_module.name;
    document.getElementById("uart_result_timer_clock_source").innerHTML = "SYSCLK / " + result.timer_clock_source;
    document.getElementById("uart_result_timer_mode").innerHTML = result.timer_mode;
    document.getElementById("uart_result_bit_per_sec").innerHTML = result.bit_per_sec.toFixed(0);
    document.getElementById("uart_result_accuracy").innerHTML = result.accuracy.toFixed(3) + " %";

    $("#uart_result_success").show();
  } else {
    $("#uart_result_failure").show();
  }
}

function execute_adc_application() {
  var mcu_name = "C8051F410";
  var R = document.getElementById("adc_r_ext").value;
  var system_clock = document.getElementById("adc_application_system_clock").value;
  var max_sampling_time = (1 / document.getElementById("adc_max_sampling_frequency").value);

  var result = calculateAdc(mcu_name, system_clock, R, max_sampling_time);

  $("#adc_result_placeholder, #adc_result_success, #adc_result_failure").hide();

  if (result.system_clock > 0) {
    document.getElementById("adc_result_system_clock").innerHTML = result.system_clock + " Hz";
    document.getElementById("adc_result_timer_reload_value").innerHTML = "0x" + decimalToHex(result.result_reload_value, 4) + " ( " + result.result_reload_value + " )";
    document.getElementById("adc_result_system_clock").innerHTML = result.system_clock + " Hz";
    document.getElementById("adc_result_timer_module").innerHTML = result.timer_module.name;
    document.getElementById("adc_result_timer_clock_source").innerHTML = "SYSCLK / " + result.timer_clock_source;
    document.getElementById("adc_result_timer_mode").innerHTML = result.timer_mode;
    document.getElementById("adc_result_ad0sc").innerHTML = result.ad0sc + " ( " + Math.round(result.sar_clock * 100) / 100 + " Hz )";
    document.getElementById("adc_result_sar_multiplier").innerHTML = result.sar_multiplier;
    document.getElementById("adc_result_minimum_tracking_time").innerHTML = result.minimum_tracking_time;
    document.getElementById("adc_result_post_tracking_time").innerHTML = result.post_tracking_time;
    document.getElementById("adc_result_conversion_time").innerHTML = result.conversion_time;

    $("#adc_result_success").show();
  } else {
    // All settings result in a lower tracking time than necessary.
    $("#adc_result_failure").show();

  }
}

function notify(message, type) {
  var notification_div = $("#notification_div");
  document.getElementById("notification").innerHTML = message;
  notification_div.removeClass();
  notification_div.addClass("alert");
  notification_div.addClass("alert-" + type);
  notification_div.show(0).fadeOut(5000);
}
