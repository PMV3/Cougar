function formatToTwoDecimals(value) {
  return typeof value === 'number' && !isNaN(value) ? Number(value.toFixed(2)) : value;
}
const newcanvas = document.getElementById("newcurveCanvas");
const newctx = newcanvas.getContext("2d");

const newcanvas1 = document.getElementById("newcurveCanvas1");
const newctx1 = newcanvas1.getContext("2d");

const newcanvas2 = document.getElementById("newcurveCanvas2");
const newctx2 = newcanvas2.getContext("2d");



let showerrornum;
function errorpanclear() {
  showerrornum = 0;
  let toastAlready = document.body.querySelector(".toast");
  while (toastAlready) {
    toastAlready.remove();
    toastAlready = document.body.querySelector(".toast");
  }
}
function getall() {
  errorpanclear();
  getcorrectNGval();
  getgraduationusingcomplexchart();
  getmaxt4calc();
  showchart(3);
}

function getcorrectNG() {
  errorpanclear();
  getcorrectNGval();
  showchart(0);
}
function getgraduation() {
  errorpanclear();
  getcorrectNGval();
  
  getgraduationusingcomplexchart();
  showchart(2);
  
}
function getmaxt4() {
  errorpanclear();
  getmaxt4calc();
  showchart(1);
}

function getmaxt4calc() {
  newctx1.clearRect(0, 0, newcanvas1.width, newcanvas1.height);
  const qatElement = document.getElementById("#qat").value;
  const qat = parseFloat(qatElement);

  const actrualNGElement = document.getElementById("#actualNg").value;
  const actualng = parseFloat(actrualNGElement);

  
  if (!(qat >= -45 && qat <= 50 && actualng >= 88 && actualng <= 100 )) {
    document.getElementById("#maxit4").value = "";
    showToast(
      message = "I can't count MAX T4.Input data must correct.",
      toastType = "danger",
      duration = 5000,
      fortop = showerrornum
    );
    showerrornum += 1;
    return false;
  }

  const actualngindex = parseInt(actualng-88);
  const qat_maximapval = 772 - ((772 - 97) * (50 - qat)) / 95;


  const firstval_maxi = getYForX(
    qat_maximapval,
    actualngline[actualngindex]
  );
  if (firstval_maxi == null) {
    showToast(
      message = "I can't interpolate with your input data in this MAXI T4 chart",
      toastType = "info",
      duration = 5000,
      fortop = showerrornum
    )
    showerrornum += 1;
    document.getElementById("#Enginconditionone").value = "";
    document.getElementById("#maxit4").value = "";
    return;
  }
  const secondval_maxi = getYForX(
    qat_maximapval,
    actualngline[actualngindex+1]
  );
  if (secondval_maxi == null) {
    showToast(
      message = "I can't interpolate with your input data in this MAXI T4 chart",
      toastType = "info",
      duration = 5000,
      fortop = showerrornum
    )
    showerrornum += 1;
    document.getElementById("#Enginconditionone").value = "";
    document.getElementById("#maxit4").value = "";
    return;
  }

  
 
  const Y_maximap =
  firstval_maxi +
    ((secondval_maxi - firstval_maxi) / 1) * (actualng - actualngpercent[actualngindex]);

  drawFoundPoint(newctx1, qat_maximapval, Y_maximap);
  
  drawline(
    newctx1,
    { x: qat_maximapval, y: 899 },
    { x: qat_maximapval, y: Y_maximap }
  );
  const Y_maximapval_changed =Y_maximap+(3.5359)*(qat_maximapval-97)/639;
  drawline(
    newctx1,
    { x: qat_maximapval, y: Y_maximapval_changed },
    { x: 97, y: Y_maximapval_changed }
  );
  drawFoundPointTriangle(newctx1,97,Y_maximapval_changed, type = 1);
  // return;
  const Maxi_t4val = 550+(825-Y_maximapval_changed)/ (825-90)*300 ;
  
  document.getElementById("#maxit4").value = formatToTwoDecimals(Maxi_t4val);

  const actualt4Element = document.getElementById("#actualt4").value;
  const actualt4 = parseFloat(actualt4Element);
  const differencet4 =  Maxi_t4val-actualt4;
  if(differencet4>0)
    document.getElementById("#Enginconditionone").value = "Engine is satisfactory";
  else if(differencet4<0)
    document.getElementById("#Enginconditionone").value = "Engine may be defective";
  else if(grosmargin==0)
    document.getElementById("#Enginconditionone").value = "Same";
 
  // Revised code to draw the actual T4 line
  const actualT4Ymapval = 825 - (825 - 90) * (actualt4 - 550) / 300;

  drawline(
    newctx1,
    { x: qat_maximapval, y: actualT4Ymapval },
    { x: 97, y: actualT4Ymapval }, 
    "blue" // Set the horizontal line color to blue
  );

  drawFoundPointTriangle(newctx1, 97, actualT4Ymapval, type = 1, colore = "blue");

  drawline(
    newctx1,
    { x: qat_maximapval, y: actualT4Ymapval },
    { x: qat_maximapval, y: Y_maximapval_changed }
  );


  newctx1.fillStyle = "blue";
  newctx1.font = "18px Arial ";
  newctx1.fillText("ACTUAL T4", qat_maximapval + 5, actualT4Ymapval + 20);
}



function getcorrectNGval() {
    newctx.clearRect(0, 0, newcanvas.width, newcanvas.height);
    const qatElement = document.getElementById("#qat").value;
    const qat = parseFloat(qatElement);

    const actualngpercentElement = document.getElementById("#actualNg").value;
    const actualngpercent = parseFloat(actualngpercentElement);

    const nrrpmElement = document.getElementById("#nr_rpm").value;
    const nrrpm = parseFloat(nrrpmElement);

    const nrrpm_100Element = document.getElementById("#nr_100").value;
    const nrrpm_100 = parseFloat(nrrpm_100Element);
    
    if (!(qat >= -45 && qat <= 50 && actualngpercent >= 84 && actualngpercent <= 100 && nrrpm >= 245 && nrrpm <= 275 && nrrpm_100 >= 245 && nrrpm_100 <= 275)) {
      // document.getElementById("#point_A").value = "";
      // document.getElementById("#point_B").value = "";
      // document.getElementById("#gross_margin").value = "";
      // document.getElementById("#engin_condition").value = "";
      document.getElementById("#corrected_ng").value = "";

      showToast(
        message = "I can not count Height Loose.Because input data is not correct",
        toastType = "danger",
        duration = 5000,
        fortop = showerrornum
      )
      showerrornum += 1;
      return false;
    }

    const qatmapval = 998-((998.0-628.0)*(50-qat)/90.0);
    const actualngpercentindex = parseInt(100-actualngpercent);

    const firstval = getXForY(qatmapval, ngpercentline[actualngpercentindex]);
    
    if (firstval == null) {
      showToast(
        message = "I can't interpolate with your input data in this CORRECT NG Chart",
        toastType = "info",
        duration = 5000,
        fortop = showerrornum
      )
      showerrornum += 1;
      document.getElementById("#corrected_ng").value = "";
      return;
    }

    const secondval=getXForY(qatmapval, ngpercentline[actualngpercentindex+1]);
    if (secondval == null) {
      showToast(
        message = "I can't interpolate with your input data in this CORRECT NG Chart",
        toastType = "info",
        duration = 5000,
        fortop = showerrornum
      )
      showerrornum += 1;
      document.getElementById("#corrected_ng").value = "";
      return;
    }
    
    const xvalforActualNR =
    secondval + ((firstval - secondval) * (actualngpercent - nppercentlabel[actualngpercentindex+1]));
    drawFoundPoint(newctx,xvalforActualNR,qatmapval);
    drawline(newctx,{x:85,y:qatmapval },{x:xvalforActualNR, y:qatmapval});

    const nrrpmindex = parseInt((275-nrrpm)/5);
    

    const thirdval = getYForX(xvalforActualNR, nr_rmpmline[nrrpmindex]);
    
    if (thirdval == null) {
      showToast(
        message = "I can't interpolate with your input data in this CORRECT NG Chart",
        toastType = "info",
        duration = 5000,
        fortop = showerrornum
      )
      showerrornum += 1;
      document.getElementById("#corrected_ng").value = "";
      return;
    }

    const fourthval = getYForX(xvalforActualNR, nr_rmpmline[nrrpmindex+1]);
    if (fourthval == null) {
      showToast(
        message = "I can't interpolate with your input data in this CORRECT NG Chart",
        toastType = "info",
        duration = 5000,
        fortop = showerrornum
      )
      showerrornum += 1;
      document.getElementById("#corrected_ng").value = "";
      return;
    }
    const nrYval =  fourthval + ((thirdval - fourthval) * (nrrpm - nr_rpmlabel[nrrpmindex+1])/5.0);
    drawFoundPoint(newctx,xvalforActualNR,nrYval);
    drawline(newctx,{x:xvalforActualNR,y:nrYval },{x:xvalforActualNR, y:qatmapval});

    const nrrpm_100index = parseInt((275-nrrpm_100)/5);
    const nrXval = getXForY_one(nrYval,nr_rmpmline[nrrpm_100index]);
    if (nrXval == null) {
      showToast(
        message = "I can't interpolate with your input data in this CORRECT NG Chart",
        toastType = "info",
        duration = 5000,
        fortop = showerrornum
      )
      showerrornum += 1;
      document.getElementById("#corrected_ng").value = "";
      return;
    }
    drawFoundPoint(newctx,nrXval,nrYval);
    drawFoundPoint(newctx,nrXval,qatmapval);
    drawline(newctx,{x:nrXval,y:nrYval },{x:xvalforActualNR, y:nrYval});
    drawline(newctx,{x:nrXval,y:nrYval },{x:nrXval, y:qatmapval});
    drawline(newctx,{x:84,y:qatmapval },{x:nrXval, y:qatmapval});

    for(let i=0;i<ngpercentline.length-1;i++){
      let val1= getXForY(qatmapval, ngpercentline[i]);
      let val2 = getXForY(qatmapval, ngpercentline[i+1]);
      if (val1 == null) {
        showToast(
          message = "I can't interpolate with your input data in this CORRECT NG Chart when I get valq",
          toastType = "info",
          duration = 5000,
          fortop = showerrornum
        )
        showerrornum += 1;
        document.getElementById("#corrected_ng").value = "";
        return;
      }
      if (val2 == null) {
        showToast(
          message = "I can't interpolate with your input data in this CORRECT NG Chart when I get valq",
          toastType = "info",
          duration = 5000,
          fortop = showerrornum
        )
        showerrornum += 1;
        document.getElementById("#corrected_ng").value = "";
        return;
      }
      if(nrXval<=val1&& nrXval>val2 )
      {
        let correctedval=nppercentlabel[i]-(val1-nrXval)/(val1-val2);
        document.getElementById("#corrected_ng").value = formatToTwoDecimals(correctedval);
        return;
      }
    }
    document.getElementById("#corrected_ng").value = "";
    return;
   
}


function getgraduationusingcomplexchart(){
    newctx2.clearRect(0, 0, newcanvas2.width, newcanvas2.height);
    const toqueElement = document.getElementById("#torque").value;
    const toque = parseFloat(toqueElement);

    const qatElement = document.getElementById("#qat").value;
    const qat = parseFloat(qatElement);

    const correctedNGElement = document.getElementById("#corrected_ng").value;
    const correctedNG = parseFloat(correctedNGElement);

    const nrrpmElement = document.getElementById("#nr_rpm").value;
    const nrrpm = parseFloat(nrrpmElement);

    const hpElement = document.getElementById("#hp").value;
    const speedElement = document.getElementById("#speed").value;
    const speed = parseFloat(speedElement);
    console.log(speed);
    const hp = parseFloat(hpElement);
    if (!(qat >= -45 && qat <= 50 && correctedNG >= 85 && correctedNG <= 100 && nrrpm >= 245 && nrrpm <= 275 && hp >= 0 && hp <= 15000&&toque>=36&& toque<=60)) {
      document.getElementById("#point_A").value = "";
      document.getElementById("#point_B").value = "";
      document.getElementById("#net_margin").value = "";
      document.getElementById("#gross_margin").value = "";
      document.getElementById("#engin_condition").value = "";
      document.getElementById("#corrected_ng").style.display = 'block';
      showToast(
        message = "I can not count Graduation.Because input data is not correct",
        toastType = "danger",
        duration = 5000,
        fortop = showerrornum
      )
      showerrornum += 1;
      return false;
    }

    const nrrpmmapval = 836+(980.5-836)/30.0*(275-nrrpm);
    const toqueindex = parseInt((toque-36)/2);

    const firstval = getXForY_one(nrrpmmapval,toqueline[toqueindex]);
    if (firstval == null) {
      showToast(
        message = "I can't interpolate with your input data in this Graduation Chart",
        toastType = "info",
        duration = 5000,
        fortop = showerrornum
      )
      showerrornum += 1;
      document.getElementById("#point_A").value = "";
      document.getElementById("#point_B").value = "";
      document.getElementById("#net_margin").value = "";
      document.getElementById("#gross_margin").value = "";
      document.getElementById("#engin_condition").value = "";
      document.getElementById("#corrected_ng").style.display = 'block';
      return;
    }
    const secondval = getXForY_one(nrrpmmapval,toqueline[toqueindex+1]);
    if (secondval == null) {
      showToast(
        message = "I can't interpolate with your input data in this Graduation Chart",
        toastType = "info",
        duration = 5000,
        fortop = showerrornum
      )
      showerrornum += 1;
      document.getElementById("#point_A").value = "";
      document.getElementById("#point_B").value = "";
      document.getElementById("#net_margin").value = "";
      document.getElementById("#gross_margin").value = "";
      document.getElementById("#engin_condition").value = "";
      document.getElementById("#corrected_ng").style.display = 'block';
      return;
    }
    const hpXmapval = firstval-(firstval-secondval)*(toque-toquelabe[toqueindex])/2;
    drawFoundPoint(newctx2,hpXmapval, nrrpmmapval);
    const toquexmapval = toqueline[toqueindex][0].x-(toqueline[toqueindex][0].x-toqueline[toqueindex+1][0].x)*(toque-toquelabe[toqueindex])/2;
    // drawFoundPoint(newctx2,toquexmapval, 981);
    drawline(
      newctx2,
      { x: hpXmapval, y: nrrpmmapval },
      { x: toquexmapval, y: 981 }
    );
    drawline(
      newctx2,
      { x: hpXmapval, y: nrrpmmapval },
      { x: 764, y: nrrpmmapval }
    );
    drawline(
      newctx2,
      { x: hpXmapval, y: nrrpmmapval },
      { x: hpXmapval, y: 812.5 }
    );
    drawFoundPoint(newctx2,hpXmapval, 812.5);
    const hpYmapval = 812.5-(812.5-516)*(hp/15000.0);
    let hpline_forgradientindex =-1;
    for(let i=0;i< hpline_forgradient.length-1;i++)
      {
        if(hpline_forgradient[i][0].x>=hpXmapval&&hpline_forgradient[i+1][0].x<=hpXmapval)
          {
            hpline_forgradientindex=i;
            break;
          }
      }
    // console.log(hpline_forgradientindex);
    if(hpline_forgradientindex==-1)
      {
      showToast(
        message = "I can't interpolate with your input data in this Graduation Chart",
        toastType = "info",
        duration = 5000,
        fortop = showerrornum
      )
      showerrornum += 1;
      document.getElementById("#point_A").value = "";
      document.getElementById("#point_B").value = "";
      document.getElementById("#net_margin").value = "";
      document.getElementById("#gross_margin").value = "";
      document.getElementById("#engin_condition").value = "";
      document.getElementById("#corrected_ng").style.display = 'block';
      return;
    }

    const thirdval = getXForY_one(hpYmapval,hpline_forgradient[hpline_forgradientindex]);
    if (thirdval == null) {
      showToast(
        message = "I can't interpolate with your input data in this Graduation Chart",
        toastType = "info",
        duration = 5000,
        fortop = showerrornum
      )
      showerrornum += 1;
      document.getElementById("#point_A").value = "";
      document.getElementById("#point_B").value = "";
      document.getElementById("#net_margin").value = "";
      document.getElementById("#gross_margin").value = "";
      document.getElementById("#engin_condition").value = "";
      document.getElementById("#corrected_ng").style.display = 'block';
      return;
    }
    const fourth = getXForY_one(hpYmapval,hpline_forgradient[hpline_forgradientindex+1]);
    if (fourth == null) {
      showToast(
        message = "I can't interpolate with your input data in this Graduation Chart",
        toastType = "info",
        duration = 5000,
        fortop = showerrornum
      )
      showerrornum += 1;
      document.getElementById("#point_A").value = "";
      document.getElementById("#point_B").value = "";
      document.getElementById("#net_margin").value = "";
      document.getElementById("#gross_margin").value = "";
      document.getElementById("#engin_condition").value = "";
      document.getElementById("#corrected_ng").style.display = 'block';
      return;
    }
    const pointAmapval = thirdval-(thirdval-fourth)*(hpline_forgradient[hpline_forgradientindex][0].x-hpXmapval)/(hpline_forgradient[hpline_forgradientindex][0].x-hpline_forgradient[hpline_forgradientindex+1][0].x);
    drawFoundPoint(newctx2, pointAmapval, hpYmapval);
    drawline(
      newctx2,
      { x: pointAmapval, y: hpYmapval },
      { x: hpXmapval, y: 812.5 }
    );
    drawline(
      newctx2,
      { x: pointAmapval, y: hpYmapval },
      { x: 765, y: hpYmapval }
    );
    drawline(
      newctx2,
      { x: pointAmapval, y: hpYmapval },
      { x: pointAmapval, y: 503 }
    );
    drawFoundPoint(newctx2, pointAmapval, 503);
    // Add these lines:
newctx2.fillStyle = "blue";
newctx2.font = "16px Arial";
newctx2.fillText("A", pointAmapval + 5, 508);
    let pointA =-1;
    for(let i=0;i<graduationlabel.length-1;i++)
      {
        if(graduationlabel[i].x>=pointAmapval&&graduationlabel[i+1].x<=pointAmapval)
          {
            pointA = i + (graduationlabel[i].x-pointAmapval)/(graduationlabel[i].x-graduationlabel[i+1].x);
            break;
          }
      }
    if(pointA==-1){
      showToast(
        message = "I can't interpolate with your input data in this Graduation Chart",
        toastType = "info",
        duration = 5000,
        fortop = showerrornum
      )
      showerrornum += 1;
      document.getElementById("#point_A").value = "";
      document.getElementById("#point_B").value = "";
      document.getElementById("#net_margin").value = "";
      document.getElementById("#gross_margin").value = "";
      document.getElementById("#engin_condition").value = "";
      document.getElementById("#corrected_ng").style.display = 'block';
      return;
    }
    document.getElementById("#point_A").value = formatToTwoDecimals(pointA);

    const qatYmapval = 6+(464-6)*(50-qat)/90;
    const correctedngindex =  parseInt(correctedNG-85);
    const fifthval = getXForY(qatYmapval,correctNGlineforgraduation[correctedngindex]);
    if (fifthval == null) {
      showToast(
        message = "I can't interpolate with your input data in this Graduation Chart",
        toastType = "info",
        duration = 5000,
        fortop = showerrornum
      )
      showerrornum += 1;
      document.getElementById("#point_A").value = "";
      document.getElementById("#point_B").value = "";
      document.getElementById("#net_margin").value = "";
      document.getElementById("#gross_margin").value = "";
      document.getElementById("#engin_condition").value = "";
      document.getElementById("#corrected_ng").style.display = 'block';
      return;
    }

    const sixthval = getXForY(qatYmapval,correctNGlineforgraduation[correctedngindex+1]);
    if (sixthval == null) {
      showToast(
        message = "I can't interpolate with your input data in this Graduation Chart",
        toastType = "info",
        duration = 5000,
        fortop = showerrornum
      )
      showerrornum += 1;
      document.getElementById("#point_A").value = "";
      document.getElementById("#point_B").value = "";
      document.getElementById("#net_margin").value = "";
      document.getElementById("#gross_margin").value = "";
      document.getElementById("#engin_condition").value = "";
      document.getElementById("#corrected_ng").style.display = 'block';
      return;
    }

    const posintBmapval = fifthval-(fifthval-sixthval)*(correctedNG-correctNGlineforgraduationLabel[correctedngindex]);
    drawFoundPoint(newctx2,posintBmapval,qatYmapval);
    drawline(
      newctx2,
      { x: 765, y: qatYmapval },
      { x: posintBmapval, y: qatYmapval }
    );
    drawline(
      newctx2,
      { x: posintBmapval, y: qatYmapval },
      { x: posintBmapval, y: 503 }
    );
    drawFoundPoint(newctx2,posintBmapval,503);
    // Add these lines:
newctx2.fillStyle = "blue";
newctx2.font = "16px Arial";
newctx2.fillText("B", posintBmapval + 5, 508);
    let pointB=-1;
    for(let i=0;i<graduationlabel.length-1;i++)
      {
        if(graduationlabel[i].x>=posintBmapval&&graduationlabel[i+1].x<=posintBmapval)
          {
            pointB = i + (graduationlabel[i].x-posintBmapval)/(graduationlabel[i].x-graduationlabel[i+1].x);
            break;
          }
      }
    if(pointB==-1){
        showToast(
          message = "I can't interpolate with your input data in this Graduation Chart",
          toastType = "info",
          duration = 5000,
          fortop = showerrornum
        )
        showerrornum += 1;
        document.getElementById("#point_A").value = "";
        document.getElementById("#point_B").value = "";
        document.getElementById("#net_margin").value = "";
        document.getElementById("#gross_margin").value = "";
        document.getElementById("#engin_condition").value = "";
        document.getElementById("#corrected_ng").style.display = 'block';
        return;
      }
      document.getElementById("#point_B").value = formatToTwoDecimals(pointB);
      const grosmargin = pointA-pointB;
      if(speed>=140)
        document.getElementById("#net_margin").value = formatToTwoDecimals(grosmargin-2);
      else if(speed<=120)
        document.getElementById("#net_margin").value = formatToTwoDecimals(grosmargin);
      else 
        document.getElementById("#net_margin").value = formatToTwoDecimals (grosmargin-1);

      
        document.getElementById("#gross_margin").value = formatToTwoDecimals(grosmargin);
        if(grosmargin>0)
        document.getElementById("#engin_condition").value = "Engine is satisfactory";
      else if(grosmargin<0)
        document.getElementById("#engin_condition").value = "Engine may be defective";
      else if(grosmargin==0)
        document.getElementById("#engin_condition").value = "Same";
    // drawFoundPoint(newctx2,sixthval,qatYmapval);
    return; 
    
} 


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

function drawFoundPointTriangle(ctx, x, y, type=0,colore = "red") {
  if (y !== null) {
    if(type==0)
      {
      const size = 10; // size of the triangle

      ctx.beginPath();
      ctx.moveTo(x, y - size / 2); // Top vertex
      ctx.lineTo(x - size / 2, y + size / 2); // Bottom left vertex
      ctx.lineTo(x + size / 2, y + size / 2); // Bottom right vertex
      ctx.closePath();
      
      ctx.fillStyle = colore; // Distinct color for the found point
      ctx.fill();
    }else if(type==1){
      const size = 16; // size of the triangle
      ctx.beginPath();
      ctx.moveTo(x+size / 2, y - size / 2); // Top vertex
      ctx.lineTo(x , y); // Bottom left vertex
      ctx.lineTo(x +size / 2, y + size / 2); // Bottom right vertex
      ctx.closePath();
      
      ctx.fillStyle = colore; // Distinct color for the found point
      ctx.fill();
    }
  }
}


const zeroPoint = { x: 50, y: 550 }; // Zero point (origin) of the coordinate system
const horizontalAxisPoint = { x: 750, y: 550 }; // A point on the horizontal axis (for x-axis direction)
const verticalAxisPoint = { x: 50, y: 50 }; // A point on the vertical axis (for y-axis direction)

// const testxvalue = 445;
// for(let i = 0; i< correctNGlineforgraduation.length;i++){
//   const testedyvalue = getYForX(testxvalue, correctNGlineforgraduation[i]);
//   console.log("testedyvalue",testedyvalue);
//   drawFoundPoint(newctx2,testxvalue,testedyvalue);
// }
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

function drawline(ctx, point1, pint2, colore = "red") {
  ctx.beginPath();
  ctx.moveTo(point1.x, point1.y);
  ctx.lineTo(pint2.x, pint2.y);
  ctx.strokeStyle = colore;
  ctx.stroke();
}

function showchart(num) {
  if (num == 0) {
    
    document.getElementById("#fornew0").style.display = "block";
    document.getElementById("#fornew1").style.display = "none";
    document.getElementById("#fornew3").style.display = "none";
    newcanvas.style.display= "block";
    newcanvas1.style.display = "none";
    newcanvas2.style.display = "none";
  }
  else if (num == 1) {
    
    document.getElementById("#fornew0").style.display = "none";
    document.getElementById("#fornew1").style.display = "none";
    document.getElementById("#fornew3").style.display = "block";
    newcanvas.style.display= "none";
    newcanvas2.style.display = "none";
    newcanvas1.style.display = "block";
  }
  else if (num == 2) {
    
    document.getElementById("#fornew0").style.display = "block";
    document.getElementById("#fornew1").style.display = "block";
    document.getElementById("#fornew3").style.display = "none";
    newcanvas.style.display= "none";
    newcanvas2.style.display = "block";
    newcanvas1.style.display = "none";
  }
  else if (num==3){
    document.getElementById("#fornew0").style.display = "block";
    document.getElementById("#fornew1").style.display = "block";
    document.getElementById("#fornew3").style.display = "block";
    newcanvas.style.display= "none";
    newcanvas2.style.display = "none";
    newcanvas1.style.display = "none";
  }
}
