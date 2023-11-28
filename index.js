const tableRows = {
  total: "Total",
  totalContrib: "Total Contributed",
  initialInterest: "Monthly interest at start of retirement",
  runoutAge: "Age at account exhaustion",
  comparison: "Total Savings Ratio (Roth/Trad)"
}

const subTableRows = {
  subTotal: 'Total Contributed',
  subMonthly: 'Monthly',
  subYearly: 'Yearly'
}

let incomeId = 0;

let intervalsSet = new Set([]);

stdStrat = {
  idx: 1,
  contribYearly: (income, thAfterTaxContrib, taxRate) =>
    (income
      - (thAfterTaxContrib / (1 - taxRate + 0.01))),
  totalWithdrawal: (inflated, thWithdrawal, wTax) =>
    (inflated * (thWithdrawal / (1 - wTax)))
}

rothStrat = {
  idx: 2,
  contribYearly: (income, thAfterTaxContrib, taxRate) =>
    (income - (income * taxRate) - thAfterTaxContrib),
  totalWithdrawal: (thWithdrawal, inflated, wTax) =>
    (thWithdrawal * inflated)
}

function initTable(tableId, requiredRows) {
  let tble = document.getElementById(tableId);
  const ids = Object.keys(requiredRows);
  for (let id of ids) {
    let row = document.createElement('tr');
    row.id = id;
    let rowLabel = document.createElement('td');
    rowLabel.innerHTML = requiredRows[id];
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
    income: document.getElementById("income").value,
    taxRate: 0.01 * document.getElementById("tax-rate").value,
    withdrawalTax: 0.01 * document.getElementById("with-rate").value,
    returnRate: 0.01 * document.getElementById("return-rate").value,
    match: 0.01 * document.getElementById("match").value,
    thAfterTaxContrib: document.getElementById("dtake-home").value,
    thWithdrawal: document.getElementById("th-withdrawal").value,
    inflation: 0.01 * document.getElementById('inflation').value
  };

  const icIntervals = getIncomeIntervals(par.retAge);  // ages are in months
  // each income interval age-sorted, with retirement age as sentinel val

  months = (par.retAge - par.currAge - 1) * 12;
  maxMatch = par.match * par.income;

  let inflated = (1 + (par.inflation / 12)) ** months;

  const stdTotal = calcAndDisplay(par, icIntervals, months, maxMatch,
    inflated, stdStrat);
  
  const rothTotal = calcAndDisplay(par, icIntervals, months, maxMatch,
    inflated, rothStrat);

  setRowChildByID('comparison', 1, Number(rothTotal/stdTotal).toFixed(2));
}

function calcAndDisplay(par, icIntervals, months, maxMatch, inflated, strat) {
  let i = 0;
  let total = 0;
  let totalContrib = 0;
  while (icIntervals[i].startAge < par.retAge * 12) {
    let itvl = icIntervals[i];
    const contribYearly = strat.contribYearly(itvl.income,
      itvl.thAfterTaxContrib, itvl.taxRate);
    const totalContribYearly = contribYearly +
      ((contribYearly < maxMatch) ? contribYearly : maxMatch);
    const contribMonthly = contribYearly / 12;
    const totalContribMonthly = totalContribYearly / 12;
  
    // age is in months
    let intervalMonths = icIntervals[i+1].startAge - itvl.startAge;
    for (j = 0; j < intervalMonths; j++) {
      total = (total * (1 + (par.returnRate / 12))) + totalContribMonthly;
    }

    totalContrib += intervalMonths * contribMonthly;
    // TODO: display data from contributions list, by ID
    // grab 1th child of div with inIntervals[i].startAge (table)
    // unhide table
    // access table elements by ID, which you will have to generate in addIncomeInterval()
    let idPostFix = (i == 0) ? '' : (i-1);
    setRowChildByID('subTotal' + idPostFix, strat.idx,
      formatUSD(intervalMonths * contribMonthly));
    setRowChildByID('subMonthly' + idPostFix, strat.idx, formatUSD(contribMonthly));
    setRowChildByID('subYearly' + idPostFix, strat.idx, formatUSD(contribYearly));
    document.getElementById(icIntervals[i].id).children[1].hidden = false;
    
    i++;
  }

  let exhaustAge = Infinity;
  let totalWithdrawal = strat.totalWithdrawal(inflated, par.thWithdrawal,
    par.withdrawalTax);
  const initialInterest = total * par.returnRate / 12;
  if (initialInterest < totalWithdrawal) {
    let remaining = total;
    let retireMonths = 0;
    while (remaining > 0 && retireMonths < 3000) {
      remaining = (remaining * (1 + (par.returnRate / 12))) - totalWithdrawal;
      totalWithdrawal *= (1 + (par.inflation / 12));
      retireMonths++;
    }
    exhaustAge = (retireMonths / 12) + par.retAge;
  }

  setRowChildByID('total', strat.idx, formatUSD(total));
  setRowChildByID('totalContrib', strat.idx, formatUSD(totalContrib));
  setRowChildByID('initialInterest', strat.idx, formatUSD(initialInterest));
  setRowChildByID('runoutAge', strat.idx, Number(exhaustAge).toFixed(2));
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

// adapted from stackoverflow
function findLableForControl(idVal) {
  const labels = document.getElementsByTagName('label');
  for(let label of labels) {
     if (label.htmlFor == idVal)
      return label;
  }
}

function removeInterval(buttonNode) {
  intervalsSet.delete(buttonNode.parentNode.id);
  buttonNode.parentNode.remove();
}

function addIncomeInterval() {
  let interval = document.getElementById('incomeTemplate').cloneNode(true);
  interval.id += incomeId;
  intervalsSet.add(interval.id);
  for (let child of interval.children[0].children) {
    if (child.tagName === 'LABEL') {
      child.htmlFor += incomeId;
    }
    else if (child.tagName === 'INPUT') {
      if (child.id === 'income') {
        child.value = Math.floor(Number(child.value) * (1.2 ** intervalsSet.size));
      } else {
        child.value = Math.floor(Number(child.value) * (1.1 ** intervalsSet.size));
      }
      child.id += incomeId;
    }
  }
  
  let removeButton = document.createElement('button');
  removeButton.setAttribute('onclick','removeInterval(this)');
  removeButton.innerHTML = 'Remove Income Interval';
  interval.appendChild(removeButton);
  document.getElementById('incomes').appendChild(interval);

  interval.children[1].id += incomeId;  // give table unique ID
  for (let row of interval.children[1].children) {
    row.id += incomeId;
    for (let col of row.children) {
      if (col.innerHTML.startsWith('$')) {
        col.innerHTML = '';
      }
    }
  }

  document.getElementById('startAge' + incomeId).hidden = false;
  findLableForControl('startAge' + incomeId).hidden = false;
  incomeId++;
}

// ages are in terms of months
// retirement age interval as sentinel value
function getIncomeIntervals(retireAge) {
  const intervals = [{
    id: 'incomeTemplate',
    startAge: 12 * document.getElementById('cur-age').value,
    income: document.getElementById("income").value,
    taxRate: 0.01 * document.getElementById("tax-rate").value,
    returnRate: 0.01 * document.getElementById("return-rate").value,
    match: 0.01 * document.getElementById("match").value,
    thAfterTaxContrib: document.getElementById("dtake-home").value,
  }];
  for (let intervalId of intervalsSet) {
    const appendId = intervalId.substring('incomeTemplate'.length);
    intervals.push({
      id: intervalId,
      startAge: 12 * document.getElementById('startAge' + appendId).value,
      income: document.getElementById("income" + appendId).value,
      taxRate: 0.01
        * document.getElementById("tax-rate" + appendId).value,
      returnRate: 0.01
        * document.getElementById("return-rate" + appendId).value,
      match: 0.01
        * document.getElementById("match" + appendId).value,
      thAfterTaxContrib: document.getElementById("dtake-home" + appendId).value,
    })
  }
  intervals.push({startAge: retireAge * 12});
  intervals.sort((a, b) => {
    if (a.startAge < b.startAge) return -1;
    else if (a.startAge > b.startAge) return 1;
    return 0;
  });
  return intervals;
}

initTable('principle-table', tableRows);
initTable('subTable', subTableRows);
