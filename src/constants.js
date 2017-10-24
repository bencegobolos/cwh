/* String constants. */
var SYSCLK = "SYSCLK";
var SYSCLK4 = "SYSCLK4";
var SYSCLK12 = "SYSCLK12";
var SYSCLK48 = "SYSCLK48";
var autoReload8Bit = "autoReload8Bit";
var autoReload16Bit = "autoReload16Bit";

var timer_application = "Timer Application";
var uart_application = "UART Application";
var adc_application = "ADC Application";
var timer_application_title = "Set overflow time of timer modules";
var uart_application_title = "Set UART configuration using Timer 1 module";
var adc_application_title = "Set Analog / Digital Converter";

/* TODO(bgobolos): use format string instead. */
function get_timer_interrupt_code(timer_interrupt_number, timer_interrupt_divisor, timer_interrupt_flag_delete) {
  return "\
void intHandler(void) __interrupt " + timer_interrupt_number + " {\n\
    static unsigned char divisor = " + timer_interrupt_divisor + ";\n\
    " + timer_interrupt_flag_delete + "\n\
    divisor--;\n\
    if (!divisor) {\n\
        divisor = " + timer_interrupt_divisor + ";\n\n\
        // Paste your code here.\n\n\
    }\n\
}";
}