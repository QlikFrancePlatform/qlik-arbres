function disableMetadataSelections() {
    document.getElementById("inputText").value = '';
    document.getElementById("selectMeasure").style.display = 'none';
    document.getElementById("selectDimension").style.display = 'none';
    document.getElementById("selectAnalysis").style.display = 'none';
    document.getElementById("inputText").style.display = 'block';
  }
  function disableQuestionBox() {
    document.getElementById("inputText").value = '';
    document.getElementById("inputText").style.display = 'none';
    document.getElementById("selectMeasure").style.display = 'block';
    document.getElementById("selectDimension").style.display = 'block';
    document.getElementById("selectAnalysis").style.display = 'block';
  }