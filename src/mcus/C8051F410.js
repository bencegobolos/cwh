/* Object representation of C8051F410. */

var Timer0 = {
  name : "Timer0",
  clock_sources : [4, 12, 48],
  modes : [autoReload8Bit],
  interrupt_name : "INT_TIMER0",
  interrupt_flag_delete : "TF0 = 0;",
  interrupt_enable_bit : "IE = 0x82;",
  control : "TMOD"
};

var Timer1 = {
  name : "Timer1",
  clock_sources : [1, 4, 12, 48],
  modes : [autoReload8Bit],
  interrupt_name : "INT_TIMER1",
  interrupt_flag_delete : "TF1 = 0;",
  interrupt_enable_bit : "IE = 0x88;",
  control : "TMOD"
};

var Timer2 = {
  name : "Timer2",
  clock_sources : [1, 12],
  modes : [autoReload16Bit, autoReload8Bit],
  interrupt_name : "INT_TIMER2",
  interrupt_flag_delete : "TF2 = 0;",
  interrupt_enable_bit : "IE = 0xA0;",
  control : "TMR2CN",
  low_reg : "TMR2L",
  high_reg : "TMR2H",
  reload_low_reg : "TMR2RLL",
  reload_high_reg : "TMR2RLH"
};

var Timer3 = {
  name : "Timer3",
  clock_sources : [1, 12],
  modes : [autoReload16Bit, autoReload8Bit],
  interrupt_name : "INT_TIMER3",
  interrupt_flag_delete : "TMR3CN &= 7F;",
  interrupt_enable_bit : "EIE1 = 0x80; IE = 0x80;",
  control : "TMR3CN",
  low_reg : "TMR3L",
  high_reg : "TMR3H",
  reload_low_reg : "TMR3RLL",
  reload_high_reg : "TMR3RLH"
};

var ADC = {
  name : "ADC"
};

var C8051F410 = {
  name : "C8051F410",
  system_clocks : [191406, 382813, 765625, 1531250, 3062500, 6125000, 12250000, 24500000],
  timer_modules : [Timer0, Timer1, Timer2, Timer3],
  adc_modules : [ADC],

  getTimerModule : function(timer_module_name) {
    for (var x in this.timer_modules) {
      var timer_module = this.timer_modules[x];
      if (timer_module.name == timer_module_name) {
        return timer_module;
      }
    }
    // No timer module has been found with the name: timer_module_name.
    return undefined;
  }
};