function IsFilter(strBarCode) {
  if (strBarCode.substring(1, 0).toUpperCase() == 'E') {
    return true;
  } else if (
    strBarCode.substring(2, 0).toUpperCase() == 'CP' &&
    strBarCode.substring(11, 13).toUpperCase() == 'TH'
  ) {
    return true;
  } else if (
    strBarCode.substring(1, 0).toUpperCase() == 'C' &&
    strBarCode.substring(11, 13).toUpperCase() != 'TH'
  ) {
    return true;
  } else if (
    strBarCode.substring(2, 0).toUpperCase() == 'KA' &&
    strBarCode.substring(11, 13).toUpperCase() == 'TH'
  ) {
    return true;
  } else if (strBarCode.substring(1, 0).toUpperCase() == 'R') {
    return true;
  } else if (strBarCode.substring(1, 0).toUpperCase() == 'L') {
    return true;
  } else if (
    strBarCode.length > 1 &&
    strBarCode.substring(2, 0).toUpperCase() == 'DS'
  ) {
    return true;
  } else if (
    strBarCode.length == 13 &&
    strBarCode.substring(1, 0).toUpperCase() == 'V' &&
    strBarCode.substring(11, 13).toUpperCase() != 'TH'
  ) {
    return true;
  } else if (
    strBarCode.length > 1 &&
    strBarCode.substring(2, 0).toUpperCase() == 'PE' &&
    strBarCode.substring(11, 13).toUpperCase() != 'TH'
  ) {
    return true;
  } else if (
    strBarCode.length > 1 &&
    strBarCode.substring(2, 0).toUpperCase() == 'VR' &&
    strBarCode.substring(11, 13).toUpperCase() == 'TH'
  ) {
    return true;
  } else if (
    strBarCode.length > 1 &&
    strBarCode.substring(2, 0).toUpperCase() == 'VS' &&
    strBarCode.substring(11, 13).toUpperCase() == 'TH'
  ) {
    return true;
  } else {
    return false;
  }
}
function IsBarcode(strBarCode) {
  var SumAll;
  var Result;
  if (strBarCode.length < 13) {
    ImgIcon.alt = 'สิ่งที่คุณป้อน ไม่ถูกรูปแบบ บาร์โคด';
    ImgIcon.src = 'Image/button_error.png';
    return true;
  }
  if (strBarCode != '') {
    if (strBarCode.length == 13) {
      if (strBarCode.substring(11, 10).toUpperCase() == 'X') {
        if (IsFilter(strBarCode)) {
          ImgIcon.alt = 'สิ่งที่คุณป้อน ถูกรูปแบบ บาร์โคด';
          ImgIcon.src = 'Image/button_ok.png';
          return true;
        } else {
          return false;
        }
      }
    } else {
      ImgIcon.alt = 'สิ่งที่คุณป้อน ไม่ถูกรูปแบบ บาร์โคด';
      ImgIcon.src = 'Image/button_error.png';
      return true;
    }
    SumAll = 0;
    SumAll = SumAll + parseInt(strBarCode.substring(3, 2)) * 8;
    SumAll = SumAll + parseInt(strBarCode.substring(4, 3)) * 6;
    SumAll = SumAll + parseInt(strBarCode.substring(5, 4)) * 4;
    SumAll = SumAll + parseInt(strBarCode.substring(6, 5)) * 2;
    SumAll = SumAll + parseInt(strBarCode.substring(7, 6)) * 3;
    SumAll = SumAll + parseInt(strBarCode.substring(8, 7)) * 5;
    SumAll = SumAll + parseInt(strBarCode.substring(9, 8)) * 9;
    SumAll = SumAll + parseInt(strBarCode.substring(10, 9)) * 7;
    Result = SumAll % 11;
    if (Result == 0) {
      if (parseInt(strBarCode.substring(11, 10)) == 5) {
        if (IsFilter(strBarCode)) {
          ImgIcon.alt = 'สิ่งที่คุณป้อน ถูกรูปแบบ บาร์โคด';
          ImgIcon.src = 'Image/button_ok.png';
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    } else if (Result == 1) {
      if (parseInt(strBarCode.substring(11, 10)) == 0) {
        if (IsFilter(strBarCode)) {
          ImgIcon.alt = 'สิ่งที่คุณป้อน ถูกรูปแบบ บาร์โคด';
          ImgIcon.src = 'Image/button_ok.png';
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    } else {
      if (parseInt(strBarCode.substring(11, 10)) == 11 - Result) {
        if (IsFilter(strBarCode)) {
          ImgIcon.alt = 'สิ่งที่คุณป้อน ถูกรูปแบบ บาร์โคด';
          ImgIcon.src = 'Image/button_ok.png';
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
  } else {
    return false;
  }
}
if (!IsBarcode(this.value)) {
  ImgIcon.alt = 'สิ่งที่คุณป้อน ไม่ถูกรูปแบบ บาร์โคด';
  ImgIcon.src = 'Image/button_error.png';
  this.focus();
}
