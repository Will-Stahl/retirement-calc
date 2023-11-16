const tableRows = {
  total: "Total",
  yearlyContrib: "Yearly Contribution",
  monthlyContrib: "Monthly Contribution",
  totalContrib: "Total Contribution (Personal)",
  initialInterest: "Interest at start of retirement",
  runoutAge: "Age at account exhaustion",
  comparison: "Total Savings Ratio (Roth/Trad)"
}

function initTable() {
  let tble = document.getElementById('principle-table');
  const ids = Object.keys(tableRows);
  for (let id of ids) {
    let row = document.createElement('tr');
    row.id = id;
    let rowLabel = document.createElement('td');
    rowLabel.innerHTML = tableRows[id];
    row.appendChild(rowLabel);
    for (let i = 0; i < 2; i++) {
      row.appendChild(document.createElement('td'));
    }
    tble.appendChild(row);
  }
}

function calculate() {
  const par = {
    currAge: Number(document.getElementById("cur-age").value),
    retAge: Number(document.getElementById("retire-age").value),
    // TODO: add expiration age
    // add option to calculate total savings needed for particular take home withdrawal
    income: document.getElementById("income").value,
    taxRate: 0.01 * document.getElementById("tax-rate").value,
    withdrawalTax: 0.01 * document.getElementById("with-rate").value,
    returnRate: 0.01 * document.getElementById("return-rate").value,
    match: 0.01 * document.getElementById("match").value,
    thAfterTaxContrib: document.getElementById("dtake-home").value,
    thWithdrawal: document.getElementById("th-withdrawal").value,
  };
  months = (par.retAge - par.currAge - 1) * 12;
  maxMatch = par.match * par.income;

  const stdTotal = calcAndDisplayStandard(par, months, maxMatch);
  
  const rothTotal = calcAndDisplayRoth(par, months, maxMatch);

  setRowChildByID('comparison', 1, Number(rothTotal/stdTotal).toFixed(2));
}

function calcAndDisplayStandard(par, months, maxMatch) {
  const contribYearly = par.income
    - (par.thAfterTaxContrib / (1 - par.taxRate + 0.01));
  const totalContribYearly = contribYearly +
    ((contribYearly < maxMatch) ? contribYearly : maxMatch);
  const contribMonthly = contribYearly / 12;
  const totalContribMonthly = totalContribYearly / 12;

  let total = totalContribMonthly;
  for (i = 0; i < months; i++) {
    total = (total * (1 + (par.returnRate / 12))) + totalContribMonthly;
  }

  let exhaustAge = Infinity;
  const totalWithdrawal = par.thWithdrawal / (1 - par.withdrawalTax);
  const initialInterest = total * par.returnRate / 12;
  if (total * par.returnRate / 12 < totalWithdrawal) {
    let remaining = total;
    let retireMonths = 0;
    while (remaining > 0) {
      remaining = (remaining * (1 + (par.returnRate / 12))) - totalWithdrawal;
      retireMonths++;
    }
    exhaustAge = (retireMonths / 12) + par.retAge;
  }

  setRowChildByID('total', 1, formatUSD(total));
  setRowChildByID('yearlyContrib', 1, formatUSD(contribYearly));
  setRowChildByID('monthlyContrib', 1, formatUSD(contribMonthly));
  setRowChildByID('totalContrib', 1, formatUSD(months * contribMonthly));
  setRowChildByID('initialInterest', 1, formatUSD(initialInterest));
  setRowChildByID('runoutAge', 1, Number(exhaustAge).toFixed(2));
  return total;

}

function calcAndDisplayRoth(par, months, maxMatch) {
  // personal contribution each year
  // calculated by desired take home pay after tax and contribution
  const contribYearly = (par.income - (par.income * par.taxRate)
    - par.thAfterTaxContrib);
  // total yearly contribution including employer match
  const totalContribYearly = contribYearly +
    ((contribYearly < maxMatch) ? contribYearly : maxMatch);
  // personal monthly contribution
  const contribMonthly = contribYearly / 12;
  // total monthly contribution, including employer match
  const totalContribMonthly = totalContribYearly / 12;
  
  let total = totalContribMonthly;
  for (i = 0; i < months; i++) {
    total = (total * (1 + (par.returnRate / 12))) + totalContribMonthly;
  }

  let exhaustAge = Infinity;
  const initialInterest = total * par.returnRate / 12;
  if (total * par.returnRate / 12 < par.thWithdrawal) {
    let remaining = total;
    let retireMonths = 0;
    while (remaining > 0) {
      remaining = (remaining * (1 + (par.returnRate / 12))) - par.thWithdrawal;
      retireMonths++;
    }
    exhaustAge = (retireMonths / 12) + par.retAge;
  }

  setRowChildByID('total', 2, formatUSD(total));
  setRowChildByID('yearlyContrib', 2, formatUSD(contribYearly));
  setRowChildByID('monthlyContrib', 2, formatUSD(contribMonthly));
  setRowChildByID('totalContrib', 2, formatUSD(months * contribMonthly));
  setRowChildByID('initialInterest', 2, formatUSD(initialInterest));
  setRowChildByID('runoutAge', 2, Number(exhaustAge).toFixed(2));
  return total;
}

function setRowChildByID(id, childIdx, content) {
  document.getElementById(id).children[childIdx].innerHTML = content;
}

function formatUSD(amount) {
  let USDollar = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  return USDollar.format(amount);
}

// takehome = (income - contrib) * (1 - rate(income - contrib))
initTable();
