const calculateScore = (easy, medium, hard) => {
  return easy * 1 + medium * 3 + hard * 5;
};
module.exports = calculateScore;