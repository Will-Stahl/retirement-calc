function calculate() {
  const currAge = document.getElementById("cur-age").value;
  const retAge = document.getElementById("retire-age").value;
  // TODO: add expiration age, use to calculate take home withdrawals
  // add option to calculate total savings needed for particular take home withdrawal
  const income = document.getElementById("income").value;
  const taxRate = 0.01 * document.getElementById("tax-rate").value;
  const withdrawalTax = 0.01 * document.getElementById("with-rate").value;
  const returnRate = 0.01 * document.getElementById("return-rate").value;
  const match = 0.01 * document.getElementById("match").value;
  const thAfterTaxContrib = document.getElementById("dtake-home").value;
  const thWithdrawal = document.getElementById("th-withdrawal").value;

  const months = (retAge - currAge - 1) * 12;
  const maxMatch = match * income;

  // ==============================
  // ========= total roth savings calcs:

  // personal contribution each year
  // calculated by desired take home pay after tax and contribution
  const rothContribYearly = (income - (income * taxRate) - thAfterTaxContrib);
  // total yearly contribution including employer match
  const totalRothContribYearly = rothContribYearly +
    ((rothContribYearly < maxMatch) ? rothContribYearly : maxMatch);
  // personal monthly contribution
  const rothContribMonthly = rothContribYearly / 12;
  // total monthly contribution, including employer match
  const totalRothContribMonthly = totalRothContribYearly / 12;
  
  var total = totalRothContribMonthly;
  for (i = 0; i < months; i++) {
    total = (total * (1 + (returnRate / 12))) + totalRothContribMonthly;
  }

  const result = "Total Savings at retirment: " + formatUSD(total) + "<br>"
    + "Yearly contribution: " + formatUSD(rothContribYearly) + "<br>"
    + "Monthly contribution: " + formatUSD(rothContribMonthly) + "<br>";
  document.getElementById("roth-result").innerHTML = result;

  // =====================================
  // ========== total standard savigns calcs:
  // + 0.01 a mere estimate of lowered tax
  const stdContribYearly = income - (thAfterTaxContrib / (1 - taxRate + 0.01));
  const totalStdContribYearly = stdContribYearly +
    ((stdContribYearly < maxMatch) ? stdContribYearly : maxMatch);
  const stdContribMonthly = stdContribYearly / 12;
  const totalStdContribMonthly = totalStdContribYearly / 12;

  var stdTotal = totalStdContribMonthly;
  for (i = 0; i < months; i++) {
    stdTotal = (stdTotal * (1 + (returnRate / 12))) + totalStdContribMonthly;
  }

  const stdResult = "Standard Total Savings at retirment: " + formatUSD(stdTotal) + "<br>"
    + "Yearly contribution: " + formatUSD(stdContribYearly) + "<br>"
    + "Monthly contribution: " + formatUSD(stdContribMonthly) + "<br>";
  document.getElementById("std-result").innerHTML = stdResult;

  document.getElementById("comparison").innerHTML =
    "Total Savings Ratio: " + total / stdTotal;
}

function formatUSD(amount) {
  let USDollar = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  return USDollar.format(amount);
}

// takehome = (income - contrib) * (1 - rate(income - contrib))
