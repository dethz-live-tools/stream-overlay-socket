export const Greeting = () => {
  const Time = new Date().getHours();

  if (Time > 0 && Time < 12) {
    return "Good Morning, Code No.7!";
  } else if (Time > 12 && Time < 18) {
    return "Good Afternoon, Code No.7!";
  } else {
    return "Good Evening, Code No.7!";
  }
};

export const GoodBye = () => {
  const Time = new Date().getHours();

  if (Time > 6 && Time < 20) {
    return "Good Bye, Code No.7!";
  } else {
    return "Good Night, Code No.7!";
  }
};
