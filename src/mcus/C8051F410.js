/* Object representation of C8051F410. */

var Timer0 = {
  name : "Timer0",
  clock_sources : [SYSCLK4, SYSCLK12, SYSCLK48],
  modes : [autoReload8Bit],
  interrupt_name : "INT_TIMER0",
  interrupt_flag_delete : "TF0 = 0;"
};

var Timer1 = {
  name : "Timer1",
  clock_sources : [SYSCLK, SYSCLK4, SYSCLK12, SYSCLK48],
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

var C8051F410 = {
  name : "C8051F410",
  system_clocks : [191406, 382813, 765625, 1531250, 3062500, 6125000, 12250000, 24500000],
  timer_modules : [Timer0, Timer1, Timer2, Timer3],
  set_modules : []
};