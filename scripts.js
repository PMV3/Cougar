function formatToTwoDecimals(value) {
  return typeof value === 'number' && !isNaN(value) ? Number(value.toFixed(2)) : value;
}
const canvas = document.getElementById("curveCanvas");
const ctx = canvas.getContext("2d");

const canvas1 = document.getElementById("curveCanvas1");
const ctx1 = canvas1.getContext("2d");

const canvas2 = document.getElementById("curveCanvas2");
const ctx2 = canvas2.getContext("2d");

const canvas3 = document.getElementById("curveCanvas3");
const ctx3 = canvas3.getContext("2d");

const canvas4 = document.getElementById("curveCanvas4");
const ctx4 = canvas4.getContext("2d");

const canvas5 = document.getElementById("curveCanvas5");
const ctx5 = canvas5.getContext("2d");

let showerrornum;

function getDataFromStep1() {
  const totalWeight = localStorage.getItem('totalWeight');
  const temperature = localStorage.getItem('temperature');
  const height = localStorage.getItem('height');
  const windSpeed = localStorage.getItem('windSpeed');

  if (totalWeight) document.getElementById("#acweight").value = totalWeight;
  if (temperature) document.getElementById("#qat").value = temperature;
  if (height) document.getElementById("#hp").value = height;
  if (windSpeed) document.getElementById("#wind").value = windSpeed;

  // Clear the localStorage after retrieving the data
  localStorage.removeItem('totalWeight');
  localStorage.removeItem('temperature');
  localStorage.removeItem('height');
  localStorage.removeItem('windSpeed');

  totalcount(); // Recalculate all values based on retrieved data
}

function saveDataAndGoToStep3() {
  const totalWeight = document.getElementById("#acweight").value;
  const height = document.getElementById("#hp").value;
  const temperature = document.getElementById("#qat").value;
  const windSpeed = document.getElementById("#wind").value;

  localStorage.setItem('step3_totalWeight', totalWeight);
  localStorage.setItem('step3_height', height);
  localStorage.setItem('step3_temperature', temperature);
  localStorage.setItem('step3_windSpeed', windSpeed);

  window.location.href = 'STEP3.html';
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', getDataFromStep1);

function errorpanclear() {
  showerrornum = 0;
  let toastAlready = document.body.querySelector(".toast");
  while (toastAlready) {
    toastAlready.remove();
    toastAlready = document.body.querySelector(".toast");
  }
}
function totalcount() {
  errorpanclear();
  count_6();
  count(1);
  count_3();
  count_4();
  count_5();
  count_7();
  showchart(0);
}
function heightloosebuttondown() {
  errorpanclear();
  count_6();
  count(1);
  showchart(1);
}
function weightindexbuttondown() {
  errorpanclear();
  count_6();
  showchart(6);
}
function serviceilingbuttondown() {
  errorpanclear();
  count_3();
  showchart(3);
}
function enginhogebuttondown() {
  errorpanclear();
  count_4();
  showchart(4);
}
function enginigebuttondown() {
  errorpanclear();
  count_5();
  showchart(5);
}
function rcbuttondown() {
  errorpanclear();
  count_6();
  count_7();
  showchart(7);
}


// Add these event listeners at the end of your script
document.getElementById("#qat").addEventListener('input', totalcount);
document.getElementById("#hp").addEventListener('input', totalcount);
document.getElementById("#acweight").addEventListener('input', totalcount);
document.getElementById("#wind").addEventListener('input', totalcount);

function count(num) {
  if (num == 1) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const qatElement = document.getElementById("#qat").value;
    const qat = parseFloat(qatElement);

    const HPElement = document.getElementById("#hp").value;
    const hp = parseFloat(HPElement);

    const actualweightElement = document.getElementById("#acweight").value;
    const acweight = parseFloat(actualweightElement);

    const windElement = document.getElementById("#wind").value;
    const wind = parseFloat(windElement);
    let mainflag_1 = false;
    const weightindex_6 = parseFloat(document.getElementById("#Wheight_index_6").value);
    if (weightindex_6 >= 7 && weightindex_6 <= 11)
      mainflag_1 = true;

    if (!(qat >= -50 && qat <= 50 && hp >= 0 && hp <= 10000 && acweight >= 13000 && acweight <= 21495 && wind >= 0 && wind <= 50)) {
    document.getElementById("#heightloose").value = formatToTwoDecimals(heightloose);
document.getElementById("#weighindex").value = formatToTwoDecimals(weightindex);
      if (mainflag_1) {
        const val_1_1 = count_1_1();
        return val_1_1;
      }
      showToast(
        message = "I can not count Height Loose.Because input data is not correct",
        toastType = "danger",
        duration = 5000,
        fortop = showerrornum
      )
      showerrornum += 1;
      return false;
    }

    const hppos = parseInt(hp / 1000);
    const weightpos = parseInt(
      acweight > 21000 && acweight <= 21495
        ? 0
        : (21000 - acweight - 0.01) / 1000 + 1
    );

    const windpos = parseInt((50 - wind) / 10);

    const qatmapval = (465 - 101) * ((qat + 40) / 90) + 101;

    const firstval = getYForX(qatmapval, hpftline[hppos]);
    if (firstval == null) {
      if (mainflag_1) {
        const val_1_1 = count_1_1();
        return val_1_1;
      }
      showToast(
        message = "I can't interpolate with your input data in this Height Loose Chart",
        toastType = "info",
        duration = 5000,
        fortop = showerrornum
      )
      showerrornum += 1;
    document.getElementById("#heightloose").value = formatToTwoDecimals(heightloose);
document.getElementById("#weighindex").value = formatToTwoDecimals(weightindex);
      return;
    }

    const secondval = getYForX(qatmapval, hpftline[hppos + 1]);
    if (secondval == null) {
      if (mainflag_1) {
        const val_1_1 = count_1_1();
        return val_1_1;
      }
      showToast(
        message = "I can't interpolate with your input data in this Height Loose Chart",
        toastType = "info",
        duration = 5000,
        fortop = showerrornum
      )
      showerrornum += 1;
    document.getElementById("#heightloose").value = formatToTwoDecimals(heightloose);
document.getElementById("#weighindex").value = formatToTwoDecimals(weightindex);
      return;
    }
    const Yval =
      firstval + ((secondval - firstval) * (hp - hptf[hppos])) / 1000;

    drawFoundPoint(ctx, qatmapval, Yval);
    drawline(ctx, { x: qatmapval, y: 531 }, { x: qatmapval, y: Yval });

    const thirdval = getXForY(Yval, ActualWeightline[weightpos]);
    if (thirdval == null) {
      if (mainflag_1) {
        const val_1_1 = count_1_1();
        return val_1_1;
      }
      showToast(
        message = "I can't interpolate with your input data in this Height Loose Chart",
        toastType = "info",
        duration = 5000,
        fortop = showerrornum
      )
      showerrornum += 1;
    document.getElementById("#heightloose").value = formatToTwoDecimals(heightloose);
document.getElementById("#weighindex").value = formatToTwoDecimals(weightindex);
      return;
    }
    const fourthval = getXForY(Yval, ActualWeightline[weightpos + 1]);
    if (fourthval == null) {
      if (mainflag_1) {
        const val_1_1 = count_1_1();
        return val_1_1;
      }
      showToast(
        message = "I can't interpolate with your input data in this Height Loose Chart",
        toastType = "info",
        duration = 5000,
        fortop = showerrornum
      )
      showerrornum += 1;
    document.getElementById("#heightloose").value = formatToTwoDecimals(heightloose);
document.getElementById("#weighindex").value = formatToTwoDecimals(weightindex);
      return;
    }
    const wightindexMapval =
      thirdval +
      ((fourthval - thirdval) * (Actualweigt[weightpos] - acweight)) /
      (Actualweigt[weightpos] - Actualweigt[weightpos + 1]);

    drawFoundPoint(ctx, wightindexMapval, Yval);
    drawline(
      ctx,
      { x: qatmapval, y: Yval },
      { x: wightindexMapval, y: Yval }
    );
    drawline(
      ctx,
      { x: wightindexMapval, y: Yval },
      { x: wightindexMapval, y: 530 }
    );
    const weightindex =
      7 + ((854 - wightindexMapval) / (854 - 522)) * 4;

    const fifthval = getYForX(wightindexMapval, windspeedline[windpos]);
    if (fifthval == null) {
      if (mainflag_1) {
        const val_1_1 = count_1_1();
        return val_1_1;
      }
      showToast(
        message = "I can't interpolate with your input data in this Height Loose Chart",
        toastType = "info",
        duration = 5000,
        fortop = showerrornum
      )
      showerrornum += 1;
    document.getElementById("#heightloose").value = formatToTwoDecimals(heightloose);
document.getElementById("#weighindex").value = formatToTwoDecimals(weightindex);
      return;
    }
    const sixthval = getYForX(
      wightindexMapval,
      windspeedline[windpos + 1]
    );
    if (sixthval == null) {
      if (mainflag_1) {
        const val_1_1 = count_1_1();
        return val_1_1;
      }
      showToast(
        message = "I can't interpolate with your input data in this Height Loose Chart",
        toastType = "info",
        duration = 5000,
        fortop = showerrornum
      )
      showerrornum += 1;
    document.getElementById("#heightloose").value = formatToTwoDecimals(heightloose);
document.getElementById("#weighindex").value = formatToTwoDecimals(weightindex);
      return;
    }
    const heightloosemap =
      fifthval +
      ((sixthval - fifthval) * (windspeed[windpos] - wind)) / 10;
    drawFoundPoint(ctx, wightindexMapval, heightloosemap);
    drawline(
      ctx,
      { x: wightindexMapval, y: 642 },
      { x: wightindexMapval, y: heightloosemap }
    );
    drawline(
      ctx,
      { x: 522, y: heightloosemap },
      { x: wightindexMapval, y: heightloosemap }
    );

    const heightloose =
      600 - ((1062 - heightloosemap) / (1062 - 642)) * 600;

      document.getElementById("#heightloose").value = formatToTwoDecimals(heightloose);
    }
}

function count_1_1() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const windElement = document.getElementById("#wind").value;
  const wind = parseFloat(windElement);
  if (!(wind >= 0 && wind <= 50)) {
    document.getElementById("#heightloose").value = "";
    document.getElementById("#weighindex").value = "";
    showToast(
      message = "I can not count Height Loose.Because wind is not correct",
      toastType = "danger",
      duration = 5000,
      fortop = showerrornum
    )
    showerrornum += 1;
    return false;
  }

  const windpos = parseInt((50 - wind) / 10);
  const weightindex_1_1 = document.getElementById("#Wheight_index_6").value;
  const weightindex =
    parseFloat(weightindex_1_1);

  const wightindexMapval = 854 - (weightindex - 7) / 4 * (854 - 522);

  const fifthval = getYForX(wightindexMapval, windspeedline[windpos]);
  if (fifthval == null) {
    showToast(
      message = "I can't interpolate with this Weight index in this Height Loose Chart",
      toastType = "info",
      duration = 5000,
      fortop = showerrornum
    )
    showerrornum += 1;
    document.getElementById("#heightloose").value = "";
    document.getElementById("#weighindex").value = "";
    return;
  }
  const sixthval = getYForX(
    wightindexMapval,
    windspeedline[windpos + 1]
  );
  if (sixthval == null) {
    showToast(
      message = "I can't interpolate with this Weight index in this Height Loose Chart",
      toastType = "info",
      duration = 5000,
      fortop = showerrornum
    )
    showerrornum += 1;
    document.getElementById("#heightloose").value = "";
    document.getElementById("#weighindex").value = "";
    return;
  }
  const heightloosemap =
    fifthval +
    ((sixthval - fifthval) * (windspeed[windpos] - wind)) / 10;
  drawFoundPoint(ctx, wightindexMapval, heightloosemap);
  drawline(
    ctx,
    { x: wightindexMapval, y: 642 },
    { x: wightindexMapval, y: heightloosemap }
  );
  drawline(
    ctx,
    { x: 522, y: heightloosemap },
    { x: wightindexMapval, y: heightloosemap }
  );

  const heightloose =
    600 - ((1062 - heightloosemap) / (1062 - 642)) * 600;

  document.getElementById("#heightloose").value = heightloose;
}
function count_6() {
  ctx1.clearRect(0, 0, canvas1.width, canvas1.height);
  const qatElement = document.getElementById("#qat").value;
  const qat = parseFloat(qatElement);

  const HPElement = document.getElementById("#hp").value;
  const hp = parseFloat(HPElement);

  const actualweightElement = document.getElementById("#acweight").value;
  const acweight = parseFloat(actualweightElement);

  const windElement = document.getElementById("#wind").value;
  const wind = parseFloat(windElement);
  if (!(qat >= -50 && qat <= 50 && hp >= 0 && hp <= 25000 && acweight >= 13000 && acweight <= 24700)) {
    document.getElementById("#Wheight_index_6").value = "";
    showToast(
      message = "I can't count Weight Index.Input data must correct.",
      toastType = "danger",
      duration = 5000,
      fortop = showerrornum
    );
    showerrornum += 1;
    return false;
  }
  const qat_6mapvalue = 463 - ((463 - 79) * (50 - qat)) / 95;

  const hpftindex_6 = parseInt(hp / 1000);
  const firstval_6 = getYForX(
    qat_6mapvalue,
    forhpft_6_weightindex[hpftindex_6]
  );
  if (firstval_6 == null) {
    showToast(
      message = "I can't interpolate with your input data in this Weight Index Chart",
      toastType = "info",
      duration = 5000,
      fortop = showerrornum
    )
    showerrornum += 1;
    document.getElementById("#Wheight_index_6").value = "";
    return;
  }
  const secondval_6 = getYForX(
    qat_6mapvalue,
    forhpft_6_weightindex[hpftindex_6 + 1]
  );
  if (secondval_6 == null) {
    showToast(
      message = "I can't interpolate with your input data in this Weight Index Chart",
      toastType = "info",
      duration = 5000,
      fortop = showerrornum
    )
    showerrornum += 1;
    document.getElementById("#Wheight_index_6").value = "";
    return;
  }
  const Y_6 =
    firstval_6 -
    ((firstval_6 - secondval_6) / 1000) * (hp - forhpft_6[hpftindex_6]);

  drawFoundPoint(ctx1, qat_6mapvalue, Y_6);
  drawline(
    ctx1,
    { x: qat_6mapvalue, y: 697 },
    { x: qat_6mapvalue, y: Y_6 }
  );

  const actualweightindex_6 =
    parseInt(
      acweight <= 24700 && acweight > 24000
        ? 0
        : (24000 - acweight - 0.01) / 1000
    ) + 1;
  const thirdval_6 = getXForY(
    Y_6,
    forActualweightlb_6[actualweightindex_6]
  );
  if (thirdval_6 == null) {
    showToast(
      message = "I can't interpolate with your input data in this Weight Index Chart",
      toastType = "info",
      duration = 5000,
      fortop = showerrornum
    )
    showerrornum += 1;
    document.getElementById("#Wheight_index_6").value = "";
    return;
  }
  const fourthval_6 = getXForY(
    Y_6,
    forActualweightlb_6[actualweightindex_6 + 1]
  );
  if (fourthval_6 == null) {
    showToast(
      message = "I can't interpolate with your input data in this Weight Index Chart",
      toastType = "info",
      duration = 5000,
      fortop = showerrornum
    )
    showerrornum += 1;
    document.getElementById("#Wheight_index_6").value = "";
    return;
  }
  const WeightIndexMapaval_6 =
    ((thirdval_6 - fourthval_6) *
      (acweight - forActualweightlb_6list[actualweightindex_6 + 1])) /
    (forActualweightlb_6list[actualweightindex_6] -
      forActualweightlb_6list[actualweightindex_6 + 1]) +
    fourthval_6;
  drawFoundPoint(ctx1, WeightIndexMapaval_6, Y_6);
  drawline(
    ctx1,
    { x: qat_6mapvalue, y: Y_6 },
    { x: WeightIndexMapaval_6, y: Y_6 }
  );
  drawline(
    ctx1,
    { x: WeightIndexMapaval_6, y: Y_6 },
    { x: WeightIndexMapaval_6, y: 697 }
  );

  const weightindex_6 =
    13 - ((WeightIndexMapaval_6 - 507) / (860 - 507)) * 6;
    document.getElementById("#Wheight_index_6").value = formatToTwoDecimals(weightindex_6);
  }
function count_3() {
  ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
  const qatElement = document.getElementById("#qat").value;
  const qat = parseFloat(qatElement);

  const HPElement = document.getElementById("#hp").value;
  const hp = parseFloat(HPElement);

  const actualweightElement = document.getElementById("#acweight").value;
  const acweight = parseFloat(actualweightElement);

  const windElement = document.getElementById("#wind").value;
  const wind = parseFloat(windElement);


  if (!(qat >= -45 && qat <= 50 && hp >= 0 && hp <= 20000 && acweight >= 13200 && acweight <= 21500)) {
    document.getElementById("#ceilingweight_3").value = "";
    document.getElementById("#ceilinghp_3").value = "";
    showToast(
      message = "I can't count CEILING correctly.Because input data is not correct for this counting.",
      toastType = "danger",
      duration = 5000,
      fortop = showerrornum
    );
    showerrornum += 1;
    return false;
  }
  const hptfmapval_3 = ((684 - 6) * (20000 - hp)) / 20000 + 6;

  const qatindex_3 = parseInt(
    qat >= -45 && qat <= -40 ? 9 : (50 - qat) / 10
  );
  const firstval_3 = getXForY(hptfmapval_3, Qat_3[qatindex_3]);
  const secondval_3 = getXForY(hptfmapval_3, Qat_3[qatindex_3 + 1]);
  if (firstval_3 == null || firstval_3 == null) {
    showToast(
      message = "I can't interpolate for Ceiling Weight with your input data in this CEILING Chart",
      toastType = "info",
      duration = 5000,
      fortop = showerrornum
    )
    showerrornum += 1;
    document.getElementById("#ceilingweight_3").value = "";
    document.getElementById("#ceilinghp_3").value = "";

  }
  else {
    const ceilingwightmap_3 =
      firstval_3 == secondval_3
        ? firstval_3
        : firstval_3 +
        ((forqatindex_3[qatindex_3] - qat) * (secondval_3 - firstval_3)) /
        (forqatindex_3[qatindex_3] - forqatindex_3[qatindex_3 + 1]);
    drawFoundPoint(
      ctx2,
      ceilingwightmap_3,
      hptfmapval_3,
      (colore = "blue")
    );
    drawline(
      ctx2,
      { x: 35, y: hptfmapval_3 },
      { x: ceilingwightmap_3, y: hptfmapval_3 },
      (colore = "blue")
    );
    drawline(
      ctx2,
      { x: ceilingwightmap_3, y: hptfmapval_3 },
      { x: ceilingwightmap_3, y: 750 },
      (colore = "blue")
    );
    const ceilingwight_3 =
      21500 - ((477 - ceilingwightmap_3) / (477 - 35)) * (21500 - 13200);
      document.getElementById("#ceilingweight_3").value = formatToTwoDecimals(ceilingwight_3);
    }
  const weightmapval_3 =
    477 - ((21500 - acweight) / (21500 - 13200)) * (477 - 35);

  const thirdval_3 = getYForXanother(weightmapval_3, Qat_3[qatindex_3]);
  const fourthval_3 = getYForXanother(
    weightmapval_3,
    Qat_3[qatindex_3 + 1]
  );
  if (thirdval_3 == null || fourthval_3 == null) {
    showToast(
      message = "I can't interpolate with your input data in this CEILING Chart",
      toastType = "info",
      duration = 5000,
      fortop = showerrornum
    )
    showerrornum += 1;
    document.getElementById("#ceilingweight_3").value = "";
    document.getElementById("#ceilinghp_3").value = "";
    return;
  }
  const ceilinghpmap_3 =
    fourthval_3 +
    ((qat - forqatindex_3[qatindex_3 + 1]) * (thirdval_3 - fourthval_3)) /
    (forqatindex_3[qatindex_3] - forqatindex_3[qatindex_3 + 1]);

  drawFoundPoint(ctx2, weightmapval_3, ceilinghpmap_3);
  drawline(
    ctx2,
    { x: weightmapval_3, y: 769 },
    { x: weightmapval_3, y: ceilinghpmap_3 }
  );
  drawline(
    ctx2,
    { x: weightmapval_3, y: ceilinghpmap_3 },
    { x: 35, y: ceilinghpmap_3 }
  );
  const ceilinghp_3 = 20000 - ((ceilinghpmap_3 - 6) / (683 - 6)) * 20000;

  document.getElementById("#ceilinghp_3").value = formatToTwoDecimals(ceilinghp_3);
}
function count_4() {
  ctx3.clearRect(0, 0, canvas3.width, canvas3.height);
  const qat = parseFloat(document.getElementById("#qat").value);
  const hp = parseFloat(document.getElementById("#hp").value);
  const acweight = parseFloat(document.getElementById("#acweight").value);

  if (!(qat >= -45 && qat <= 50 && hp >= 0 && hp <= 20000 && acweight >= 13200 && acweight <= 21500)) {
    document.getElementById("#enginhoge").value = "";
    document.getElementById("#enginhoge_weight").value = "";
    showToast(
      "Input data is not correct for this calculation.",
      "danger",
      5000,
      showerrornum++
    );
    return false;
  }

  // Calculate and display altitude result
  const weightmapval_4 = 568 - ((21500 - acweight) / (21500 - 13200)) * (568 - 52);
  const qatindex_4 = parseInt(qat >= -45 && qat <= -40 ? 9 : (50 - qat) / 10);
  const thirdval_4 = getYForXanother(weightmapval_4, Qat_4[qatindex_4]);
  const fourthval_4 = getYForXanother(weightmapval_4, Qat_4[qatindex_4 + 1]);

  if (thirdval_4 != null && fourthval_4 != null) {
    const enginehogemap_4 =
      fourthval_4 +
      ((qat - Qatindex_4[qatindex_4 + 1]) * (thirdval_4 - fourthval_4)) /
      (Qatindex_4[qatindex_4] - Qatindex_4[qatindex_4 + 1]);

    const enginehoge_4 = 20000 - ((enginehogemap_4 - 37) / (679 - 37)) * 20000;
    document.getElementById("#enginhoge").value = enginehoge_4.toFixed(2);

    // Draw altitude point and lines
    drawFoundPoint(ctx3, weightmapval_4, enginehogemap_4);
    drawline(
      ctx3,
      { x: weightmapval_4, y: 762 },
      { x: weightmapval_4, y: enginehogemap_4 }
    );
    drawline(
      ctx3,
      { x: weightmapval_4, y: enginehogemap_4 },
      { x: 52, y: enginehogemap_4 }
    );
  } else {
    document.getElementById("#enginhoge").value = "Unable to calculate";
  }

  // Weight calculation
  const hptfmapval_4 = 37 + ((679 - 37) * (20000 - hp)) / 20000;
  const firstval_4 = getXForY(hptfmapval_4, Qat_4[qatindex_4]);
  const secondval_4 = getXForY(hptfmapval_4, Qat_4[qatindex_4 + 1]);

  if (firstval_4 != null && secondval_4 != null) {
    const enginehogeweightmap_4 =
      firstval_4 +
      ((Qatindex_4[qatindex_4] - qat) * (secondval_4 - firstval_4)) /
      (Qatindex_4[qatindex_4] - Qatindex_4[qatindex_4 + 1]);

    const minWeight = 13200;
    const maxWeight = 21500;
    const minX = 52;
    const maxX = 568;
    
    const enginehogeweight_4 = 
      minWeight + (enginehogeweightmap_4 - minX) / (maxX - minX) * (maxWeight - minWeight);
    
    document.getElementById("#enginhoge_weight").value = enginehogeweight_4.toFixed(2);

    // Draw weight point and lines
    drawFoundPoint(ctx3, enginehogeweightmap_4, hptfmapval_4, "blue");
    drawline(
      ctx3,
      { x: 52, y: hptfmapval_4 },
      { x: enginehogeweightmap_4, y: hptfmapval_4 },
      "blue"
    );
    drawline(
      ctx3,
      { x: enginehogeweightmap_4, y: hptfmapval_4 },
      { x: enginehogeweightmap_4, y: 762 },
      "blue"
    );
  } else {
    document.getElementById("#enginhoge_weight").value = "Unable to calculate";
    showToast(
      "Unable to calculate TWIN ENG OGE Weight with the given inputs.",
      "info",
      5000,
      showerrornum++
    );
  }
}
function count_5() {
  ctx4.clearRect(0, 0, canvas4.width, canvas4.height);
  const qat = parseFloat(document.getElementById("#qat").value);
  const hp = parseFloat(document.getElementById("#hp").value);
  const acweight = parseFloat(document.getElementById("#acweight").value);
  const wind = parseFloat(document.getElementById("#wind").value);

  if (!(qat >= -45 && qat <= 50 && acweight >= 13200 && acweight <= 21500)) {
    document.getElementById("#enginIGE").value = formatToTwoDecimals(hpft_5);
document.getElementById("#enginIGE_weight").value = formatToTwoDecimals(engineIGEweight_5);
    showToast(
      "Input data is not correct for Engine IGE calculation.",
      "danger",
      5000,
      showerrornum++
    );
    return false;
  }

  const qatindex_5 = parseInt(qat >= -45 && qat <= -40 ? 9 : (50 - qat) / 10);

  // Altitude calculation
  const weightmapval_5 = 570 - ((21500 - acweight) / (21500 - 13300)) * (570 - 59);
  const firstval_5 = getYForXanother(weightmapval_5, Qat_5[qatindex_5]);
  const secondval_5 = getYForXanother(weightmapval_5, Qat_5[qatindex_5 + 1]);

  if (firstval_5 != null && secondval_5 != null) {
    const hptfmapval_5 =
      firstval_5 -
      ((firstval_5 - secondval_5) * (Qatindex_4[qatindex_5] - qat)) / 10;

    const hpft_5 = 20000 - ((hptfmapval_5 - 28) / (674 - 28)) * 20000;
    document.getElementById("#enginIGE").value = hpft_5.toFixed(2);

    // Draw altitude point and lines
    drawFoundPoint(ctx4, weightmapval_5, hptfmapval_5);
    drawline(
      ctx4,
      { x: weightmapval_5, y: 755 },
      { x: weightmapval_5, y: hptfmapval_5 }
    );
    drawline(
      ctx4,
      { x: 54, y: hptfmapval_5 },
      { x: weightmapval_5, y: hptfmapval_5 }
    );
  } else {
    document.getElementById("#enginIGE").value = "Unable to calculate";
  }

  // Weight calculation
  const hptfmapval_5_weight = 28 + ((674 - 28) * (20000 - hp)) / 20000;
  const firstval_5_weight = getXForY(hptfmapval_5_weight, Qat_5[qatindex_5]);
  const secondval_5_weight = getXForY(hptfmapval_5_weight, Qat_5[qatindex_5 + 1]);

  if (firstval_5_weight != null && secondval_5_weight != null) {
    const engineIGEweightmap_5 =
      firstval_5_weight +
      ((Qatindex_4[qatindex_5] - qat) * (secondval_5_weight - firstval_5_weight)) /
      (Qatindex_4[qatindex_5] - Qatindex_4[qatindex_5 + 1]);

    const minWeight = 13300;
    const maxWeight = 21500;
    const minX = 59;
    const maxX = 570;
    
    const engineIGEweight_5 = 
      minWeight + (engineIGEweightmap_5 - minX) / (maxX - minX) * (maxWeight - minWeight);
    
    document.getElementById("#enginIGE_weight").value = engineIGEweight_5.toFixed(2);

    // Draw weight point and lines
    drawFoundPoint(ctx4, engineIGEweightmap_5, hptfmapval_5_weight, "blue");
    drawline(
      ctx4,
      { x: 59, y: hptfmapval_5_weight },
      { x: engineIGEweightmap_5, y: hptfmapval_5_weight },
      "blue"
    );
    drawline(
      ctx4,
      { x: engineIGEweightmap_5, y: hptfmapval_5_weight },
      { x: engineIGEweightmap_5, y: 755 },
      "blue"
    );
  } else {
    document.getElementById("#enginIGE_weight").value = "Unable to calculate";
    showToast(
      "Unable to calculate Engine IGE Weight with the given inputs.",
      "info",
      5000,
      showerrornum++
    );
  }
}
function count_7() {
  ctx5.clearRect(0, 0, canvas5.width, canvas5.height);
  const qatElement = document.getElementById("#qat").value;
  const qat = parseFloat(qatElement);

  const HPElement = document.getElementById("#hp").value;
  const hp = parseFloat(HPElement);

  const actualweightElement = document.getElementById("#acweight").value;
  const acweight = parseFloat(actualweightElement);

  const windElement = document.getElementById("#wind").value;
  const wind = parseFloat(windElement);
  const weightindexcomplete_7 = parseFloat(
    document.getElementById("#Wheight_index_6").value
  );

  if (!(qat >= -45 && qat <= 50 && weightindexcomplete_7 >= 7 && weightindexcomplete_7 <= 13 && hp >= 0 && hp <= 25000)) {
    document.getElementById("#rc").value = "";
    showToast(
      message = "I can't count R/C correctly.Input data or Weight Index must be correct.",
      toastType = "danger",
      duration = 5000,
      fortop = showerrornum
    );
    showerrornum += 1;
    return false;
  }
  const catmapval_7 = (416 - 64) * ((qat + 45) / 95) + 64;
  let hpftcome_7;
  for (var xm = 0; xm < hpftindex_7.length - 1; xm++)
    if (hpftindex_7[xm] >= hp && hpftindex_7[xm + 1] < hp) {
      hpftcome_7 = xm;
      break;
    }

  const firstval_7 = getYForXanother(catmapval_7, hpft_7[hpftcome_7]);
  const secondval_7 = getYForXanother(
    catmapval_7,
    hpft_7[hpftcome_7 + 1]
  );
  if (firstval_7 == null || secondval_7 == null) {
    showToast(
      message = "I can't interpolate with your input data in this R/C Chart",
      toastType = "info",
      duration = 5000,
      fortop = showerrornum
    )
    showerrornum += 1;
    document.getElementById("#rc").value = "";
    return;
  }
  const Y_val_dd7 =
    secondval_7 +
    ((firstval_7 - secondval_7) * (hp - hpftindex_7[hpftcome_7 + 1])) /
    (hpftindex_7[hpftcome_7] - hpftindex_7[hpftcome_7 + 1]);

  drawFoundPoint(ctx5, catmapval_7, Y_val_dd7);
  drawline(
    ctx5,
    { x: catmapval_7, y: 724 },
    { x: catmapval_7, y: Y_val_dd7 }
  );
  const weightindexcompleteindex_7 = parseInt(
    (13 - weightindexcomplete_7) / 0.5
  );
  const thirdval_7 = getXForYanother(
    Y_val_dd7,
    weightindexcomple_7[weightindexcompleteindex_7]
  );
  const fourthval_7 = getXForYanother(
    Y_val_dd7,
    weightindexcomple_7[weightindexcompleteindex_7 + 1]
  );
  if (thirdval_7 == null || fourthval_7 == null) {
    showToast(
      message = "I can't interpolate with your input data in this R/C Chart",
      toastType = "info",
      duration = 5000,
      fortop = showerrornum
    )
    showerrornum += 1;
    document.getElementById("#rc").value = "";
    return;
  }
  const rcmapval_7 =
    thirdval_7 +
    ((fourthval_7 - thirdval_7) *
      (13 - 0.5 * weightindexcompleteindex_7 - weightindexcomplete_7)) /
    0.5;

  drawFoundPoint(ctx5, rcmapval_7, Y_val_dd7);

  drawline(
    ctx5,
    { x: rcmapval_7, y: Y_val_dd7 },
    { x: catmapval_7, y: Y_val_dd7 }
  );
  drawline(
    ctx5,
    { x: rcmapval_7, y: Y_val_dd7 },
    {
      x: rcmapval_7,
      y: 724,
    }
  );
  const rcval_7 = 1500 - ((868.5 - rcmapval_7) / (868.5 - 612.5)) * 1500;
  document.getElementById("#rc").value = formatToTwoDecimals(rcval_7);}
const aircraftWeights = {
  9902: 13791,
  9905: 13858,
  9909: 13787,
  9910: 14096,
  9911: 13897,
};

document.getElementById("equipmentSelect").addEventListener("change", addEquipment);

function addEquipment() {
  const equipmentSelect = document.getElementById("equipmentSelect");
  const selectedEquipment = document.getElementById("selectedEquipment");
  const selectedOption = equipmentSelect.options[equipmentSelect.selectedIndex];

  if (selectedOption.value !== "0") {
    const equipmentItem = document.createElement("li");
    equipmentItem.classList.add("selected-equipment-item");
    equipmentItem.innerHTML = `
      ${selectedOption.text}
      <button class="remove-equipment" onclick="removeEquipment(this)">delete</button>
    `;
    selectedEquipment.appendChild(equipmentItem);
    equipmentSelect.selectedIndex = 0;
    updateEquipmentWeight();
  }
}

function removeEquipment(button) {
  const equipmentItem = button.parentElement;
  equipmentItem.remove();
  updateEquipmentWeight();
}

function updateEquipmentWeight() {
  const selectedEquipment = document.getElementById("selectedEquipment");
  const equipmentWeightInput = document.getElementById("equipmentWeight");

  let equipmentWeight = 0;

  selectedEquipment.querySelectorAll(".selected-equipment-item").forEach((item) => {
    const weight = parseFloat(item.textContent.match(/- (\d+) lbs/)[1]);
    equipmentWeight += weight;
  });

  equipmentWeightInput.value = equipmentWeight;
  updateTotalWeight();
}


function updateBaseWeight() {
  const selectedAircraft = document.getElementById("aircraftSelect").value;
  const aircraftWeights = {
    "9902": 13791,
    "9905": 13858,
    "9909": 13787,
    "9910": 14096,
    "9911": 13897,
  };

  const baseWeight = aircraftWeights[selectedAircraft] || 0;
  document.getElementById("baseWeight").value = baseWeight;
  updateTotalWeight();
}

function updateTotalWeight() {
  const baseWeight = parseFloat(document.getElementById("baseWeight").value) || 0;
  const passengerCount = parseInt(document.getElementById("passengerCount").value) || 0;
  const cargoWeight = parseFloat(document.getElementById("cargoWeight").value) || 0;
  const fuelWeight = parseFloat(document.getElementById("fuelWeight").value) || 0;
  const equipmentWeight = parseFloat(document.getElementById("equipmentWeight").value) || 0;

  const fixedPassengerWeight = 200; // Fixed weight per passenger

  const totalWeight = baseWeight + passengerCount * fixedPassengerWeight + cargoWeight + fuelWeight + equipmentWeight;
  document.querySelector("input[name='acweight']").value = totalWeight;

  console.log("Base Weight: ", baseWeight);
  console.log("Passenger Count: ", passengerCount);
  console.log("Cargo Weight: ", cargoWeight);
  console.log("Fuel Weight: ", fuelWeight);
  console.log("Equipment Weight: ", equipmentWeight);
  console.log("Total Weight: ", totalWeight);
}

function calculateWeight() {
  updateTotalWeight();
}

// Ensure initial values are set and updated correctly
updateBaseWeight();
updateTotalWeight();


function showToast(
  message = "Sample Message",
  toastType = "info",
  duration = 5000,
  fortop = 0
) {
  let box = document.createElement("div");
  box.classList.add("toast", `toast-${toastType}`);
  box.style.top = `${20 + (fortop * 65)}px`;
  box.innerHTML = ` <div class="toast-content-wrapper" > 
      <div class="toast-message">${message}</div> 
      <div class="toast-progress"></div> 
      </div>`;
  duration = 7000;
  box.querySelector(".toast-progress").style.animationDuration = `${duration / 1000}s`;

  let toastAlready = document.body.querySelector(".toast");
  document.body.appendChild(box);
};

function drawFoundPoint(ctx, x, y, colore = "red") {
  if (y !== null) {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = colore; // Distinct color for the found point
    ctx.fill();
  }
}

const zeroPoint = { x: 50, y: 550 }; // Zero point (origin) of the coordinate system
const horizontalAxisPoint = { x: 750, y: 550 }; // A point on the horizontal axis (for x-axis direction)
const verticalAxisPoint = { x: 50, y: 50 }; // A point on the vertical axis (for y-axis direction)

function drawCoordinateSystem(ctx, zeroPoint, horizontalAxisPoint, verticalAxisPoint) {
  ctx.beginPath();
  ctx.moveTo(zeroPoint.x, zeroPoint.y);
  ctx.lineTo(horizontalAxisPoint.x, horizontalAxisPoint.y);
  ctx.strokeStyle = "black";
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(zeroPoint.x, zeroPoint.y);
  ctx.lineTo(verticalAxisPoint.x, verticalAxisPoint.y);
  ctx.stroke();

  ctx.fillText("X", horizontalAxisPoint.x - 15, horizontalAxisPoint.y - 10);
  ctx.fillText("Y", verticalAxisPoint.x + 10, verticalAxisPoint.y + 15);
}

function drawline(ctx, point1, point2, colore = "red") {
  ctx.beginPath();
  ctx.moveTo(point1.x, point1.y);
  ctx.lineTo(point2.x, point2.y);
  ctx.strokeStyle = colore;
  ctx.stroke();

  // Draw arrow head
  const angle = Math.atan2(point2.y - point1.y, point2.x - point1.x);
  const headlen = 10; // Length of arrow head in pixels

  ctx.beginPath();
  ctx.moveTo(point2.x, point2.y);
  ctx.lineTo(point2.x - headlen * Math.cos(angle - Math.PI / 6), point2.y - headlen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(point2.x - headlen * Math.cos(angle + Math.PI / 6), point2.y - headlen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fillStyle = colore;
  ctx.fill();
}

function showchart(num) {
  if (num == 0) {
    document.getElementById("#for0").style.display = "block";
    document.getElementById("#for1").style.display = "block";
    document.getElementById("#for2").style.display = "block";
    document.getElementById("#for3").style.display = "block";
    document.getElementById("#for4").style.display = "block";
    document.getElementById("#for5").style.display = "block";
    document.getElementById("curveCanvas").style.display = "none";
    document.getElementById("curveCanvas1").style.display = "none";
    document.getElementById("curveCanvas2").style.display = "none";
    document.getElementById("curveCanvas3").style.display = "none";
    document.getElementById("curveCanvas4").style.display = "none";
    document.getElementById("curveCanvas5").style.display = "none";

  } else if (num == 1) {
    document.getElementById("#for0").style.display = "block";
    document.getElementById("#for1").style.display = "none";
    document.getElementById("#for2").style.display = "none";
    document.getElementById("#for3").style.display = "none";
    document.getElementById("#for4").style.display = "none";
    document.getElementById("#for5").style.display = "none";
    document.getElementById("curveCanvas").style.display = "block";
    document.getElementById("curveCanvas1").style.display = "none";
    document.getElementById("curveCanvas2").style.display = "none";
    document.getElementById("curveCanvas3").style.display = "none";
    document.getElementById("curveCanvas4").style.display = "none";
    document.getElementById("curveCanvas5").style.display = "none";
  }
  else if (num == 6) {
    document.getElementById("#for0").style.display = "none";
    document.getElementById("#for1").style.display = "block";
    document.getElementById("#for2").style.display = "none";
    document.getElementById("#for3").style.display = "none";
    document.getElementById("#for4").style.display = "none";
    document.getElementById("#for5").style.display = "none";
    document.getElementById("curveCanvas").style.display = "none";
    document.getElementById("curveCanvas1").style.display = "block";
    document.getElementById("curveCanvas2").style.display = "none";
    document.getElementById("curveCanvas3").style.display = "none";
    document.getElementById("curveCanvas4").style.display = "none";
    document.getElementById("curveCanvas5").style.display = "none";
  }
  else if (num == 3) {
    document.getElementById("#for0").style.display = "none";
    document.getElementById("#for1").style.display = "none";
    document.getElementById("#for2").style.display = "block";
    document.getElementById("#for3").style.display = "none";
    document.getElementById("#for4").style.display = "none";
    document.getElementById("#for5").style.display = "none";
    document.getElementById("curveCanvas").style.display = "none";
    document.getElementById("curveCanvas1").style.display = "none";
    document.getElementById("curveCanvas2").style.display = "block";
    document.getElementById("curveCanvas3").style.display = "none";
    document.getElementById("curveCanvas4").style.display = "none";
    document.getElementById("curveCanvas5").style.display = "none";
  }
  else if (num == 4) {
    document.getElementById("#for0").style.display = "none";
    document.getElementById("#for1").style.display = "none";
    document.getElementById("#for2").style.display = "none";
    document.getElementById("#for3").style.display = "block";
    document.getElementById("#for4").style.display = "none";
    document.getElementById("#for5").style.display = "none";
    document.getElementById("curveCanvas").style.display = "none";
    document.getElementById("curveCanvas1").style.display = "none";
    document.getElementById("curveCanvas2").style.display = "none";
    document.getElementById("curveCanvas3").style.display = "block";
    document.getElementById("curveCanvas4").style.display = "none";
    document.getElementById("curveCanvas5").style.display = "none";
  }
  else if (num == 5) {
    document.getElementById("#for0").style.display = "none";
    document.getElementById("#for1").style.display = "none";
    document.getElementById("#for2").style.display = "none";
    document.getElementById("#for3").style.display = "none";
    document.getElementById("#for4").style.display = "block";
    document.getElementById("#for5").style.display = "none";
    document.getElementById("curveCanvas").style.display = "none";
    document.getElementById("curveCanvas1").style.display = "none";
    document.getElementById("curveCanvas2").style.display = "none";
    document.getElementById("curveCanvas3").style.display = "none";
    document.getElementById("curveCanvas4").style.display = "block";
    document.getElementById("curveCanvas5").style.display = "none";
  }
  else if (num == 7) {
    document.getElementById("#for0").style.display = "none";
    document.getElementById("#for1").style.display = "block";
    document.getElementById("#for2").style.display = "none";
    document.getElementById("#for3").style.display = "none";
    document.getElementById("#for4").style.display = "none";
    document.getElementById("#for5").style.display = "block";
    document.getElementById("curveCanvas").style.display = "none";
    document.getElementById("curveCanvas1").style.display = "none";
    document.getElementById("curveCanvas2").style.display = "none";
    document.getElementById("curveCanvas3").style.display = "none";
    document.getElementById("curveCanvas4").style.display = "none";
    document.getElementById("curveCanvas5").style.display = "block";
  }
}
