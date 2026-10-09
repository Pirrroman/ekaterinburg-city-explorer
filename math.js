export const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
export const ease=value=>{const t=clamp(value);return t*t*(3-2*t);};
