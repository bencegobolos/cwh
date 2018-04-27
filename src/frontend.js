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

  $("#timer_application_is_external_clock").on("change", function () {
    var is_ext_clock = document.getElementById("timer_application_is_external_clock").checked;
    switch_system_clock_type("timer", is_ext_clock);
  });

  $("#uart_application_is_external_clock").on("change", function () {
    var is_ext_clock = document.getElementById("uart_application_is_external_clock").checked;
    switch_system_clock_type("uart", is_ext_clock);
  });

  $("#adc_application_is_external_clock").on("change", function () {
    var is_ext_clock = document.getElementById("adc_application_is_external_clock").checked;
    switch_system_clock_type("adc", is_ext_clock);
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
    document.getElementById("timer_result_failure").innerHTML = result.message;
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
    document.getElementById("uart_result_failure").innerHTML = result.message;
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
    document.getElementById("adc_result_minimum_tracking_time").innerHTML = result.minimum_tracking_time.toExponential(3) + " sec";
    document.getElementById("adc_result_post_tracking_time").innerHTML = result.post_tracking_time.toExponential(3) + " sec";
    document.getElementById("adc_result_conversion_time").innerHTML = result.conversion_time.toExponential(3) + " sec";

    $("#adc_result_success").show();
  } else {
    // All settings result in a lower tracking time than necessary.
    document.getElementById("adc_result_failure").innerHTML = result.message;
    $("#adc_result_failure").show();

  }
}

function switch_system_clock_type(application, is_external_clock) {
  var div_element = document.getElementById(application + "_application_system_clock_input_div");
  var system_clock_input_id = application + "_application_system_clock";
  var system_clock_input_element = document.getElementById(system_clock_input_id);

  if (system_clock_input_element) {
    div_element.removeChild(system_clock_input_element);
  }

  if (is_external_clock) {
    system_clock_input_element = document.createElement("input");
    system_clock_input_element.id = system_clock_input_id;
    system_clock_input_element.setAttribute("class", "form-control");
    system_clock_input_element.setAttribute("type", "number");
    system_clock_input_element.setAttribute("min", "0");
    system_clock_input_element.setAttribute("placeholder", "Please enter external clock source frequency here");
  } else {
    system_clock_input_element = document.createElement("select");
    system_clock_input_element.id = system_clock_input_id;
    system_clock_input_element.setAttribute("class", "form-control dropdown");

    var new_system_clock_element = document.createElement("option");
    new_system_clock_element.setAttribute("selected","");
    new_system_clock_element.setAttribute("value","-1" );
    new_system_clock_element.text = "Please select a system clock";
    system_clock_input_element.add(new_system_clock_element);
    for (var i = 0; i < C8051F410.system_clocks.length; i++) {
      new_system_clock_element = document.createElement("option");
      new_system_clock_element.setAttribute("value", C8051F410.system_clocks[i]);
      new_system_clock_element.text = C8051F410.system_clocks[i];
      system_clock_input_element.add(new_system_clock_element);
    }
  }

  div_element.appendChild(system_clock_input_element);
}
