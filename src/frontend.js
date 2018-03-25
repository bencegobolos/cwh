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
    //show_timer_application_result();
  });

  $("#adc_application_calculate").click(function(){
    console.log("Adc application is running...");
    execute_adc_application();
    //show_timer_application_result();
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
    //notify("ADC minimum tracking time =" + minimum_track_time.toExponential(2) + " sec", "info");
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
    document.getElementById("timer_result_timer_reload_value").innerHTML = "0x" + decimalToHex(Math.ceil(result.result_reload_value), 4) + " ( " + Math.ceil(result.result_reload_value) + " )";
    document.getElementById("timer_result_system_clock").innerHTML = result.system_clock + " Hz";
    document.getElementById("timer_result_timer_module").innerHTML = result.timer_module.name;
    document.getElementById("timer_result_timer_clock_source").innerHTML = result.timer_clock_source;
    document.getElementById("timer_result_timer_mode").innerHTML = result.timer_mode;
    document.getElementById("timer_result_timer_interrupt_code").innerHTML = get_timer_code(result);

    $("#timer_result_success").show();
  } else {
    $("#timer_result_failure").show();
  }

  /*
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
    var is_timer_used = mcu_obj.isModuleUsed(result.timer_module.name);
    if (is_timer_used == 0) {
      mcu_obj.saveModuleUsage(mcu_obj.getTimerModule(result.timer_module.name), selected_application, result);
      //print_module_usage(mcu, mcu_obj.set_modules[result.timer_module.name]);
    } else {
      if (confirm("Do you want to overwrite the usage of " + result.timer_module.name + "?")) {
        mcu_obj.saveModuleUsage(mcu_obj.getTimerModule(result.timer_module.name), selected_application, result);
        //print_module_usage(mcu, mcu_obj.set_modules[result.timer_module.name]);
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
  */
}

function execute_uart_application() {
  var mcu_name = "C8051F410";
  var bit_per_sec = document.getElementById("uart_bit_per_sec").value;
  var uart_sysclk = document.getElementById("uart_application_system_clock").value;
  var uart_accuracy = document.getElementById("uart_accuracy").value;

  var result = calculateUART(mcu_name, bit_per_sec, uart_sysclk, uart_accuracy);

  $("#uart_result_placeholder, #uart_result_success, #uart_result_failure").hide();

  if (result.system_clock > 0) {
    document.getElementById("uart_result_timer_reload_value").innerHTML = "0x" + decimalToHex(Math.ceil(result.result_reload_value), 4) + " ( " + Math.ceil(result.result_reload_value) + " )";
    document.getElementById("uart_result_system_clock").innerHTML = result.system_clock + " Hz";
    document.getElementById("uart_result_timer_module").innerHTML = result.timer_module.name;
    document.getElementById("uart_result_timer_clock_source").innerHTML = result.timer_clock_source;
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

  var minimum_track_time = (R / 1000) * 0.00000011 + 0.00000054;

  var result = calculateAdc(mcu_name, system_clock, R, max_sampling_time);

  $("#adc_result_placeholder, #adc_result_success, #adc_result_failure").hide();

  if (result.system_clock > 0) {
    document.getElementById("adc_result_system_clock").innerHTML = result.system_clock + " Hz";
    document.getElementById("adc_result_ad0sc").innerHTML = result.ad0sc + " ( " + Math.round(result.sar_clock * 100) / 100 + " Hz )";
    document.getElementById("adc_result_sar_multiplier").innerHTML = result.sar_multiplier;

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

function print_module_usage(mcu, usage) {
  var element = document.getElementById("module_usages");
  var module_usage_id = "module_usage_" + usage.result.timer_module.name;
  var module_usage_element = document.getElementById(module_usage_id);
  console.log(module_usage_element);
  if (module_usage_element) {
    console.log("deleteit");
    element.removeChild(module_usage_element);
  }
  module_usage_element = document.createElement("div");
  module_usage_element.id = module_usage_id;
  addText(module_usage_element, "System clock: " + usage.result.system_clock + " <br> " +
    "Timer module: " + usage.result.timer_module.name + " <br> " +
    "Reload value: " + "0x" + decimalToHex(Math.ceil(usage.result.result_reload_value), 4) + " <br> " +
    "Timer clock source: " + usage.result.timer_clock_source + " <br> " +
    "Timer mode: " + usage.result.timer_mode + " <br> "
  );
  element.appendChild(module_usage_element);
}

/* How to insert a javascript textNode element on a newline?
 * https://stackoverflow.com/questions/8147376/how-to-insert-a-javascript-textnode-element-on-a-newline
 */
function addText(node,text){
  var t=text.split(/\s*<br ?\/?>\s*/i),
    i;
  if(t[0].length>0){
    node.appendChild(document.createTextNode(t[0]));
  }
  for(i=1;i<t.length;i++){
    node.appendChild(document.createElement('BR'));
    if(t[i].length>0){
      node.appendChild(document.createTextNode(t[i]));
    }
  }
}
