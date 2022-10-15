import { createCourseCard, fetchCurrentSavedCourseData, getCurrentActiveTabURL } from './utils.js';

// const btnScan = document.querySelector('#btnScan');
const btnReload = document.querySelector('#btnReload');
// const code = document.querySelector('.data');
// const btnOpen = document.querySelector('#btnOpen');
const popupCoursesContainer = document.querySelector('.courses');

const addNewCourse = () => {};

const showAllCourses = () => {};

const onDeleteCourse = (e) => {};

const setCourseAttributes = () => {};



document.addEventListener("DOMContentLoaded", async () => {
  const activeTab = await getCurrentActiveTabURL();
  const { url } = activeTab;
  const courseId = url.split("/").filter(x => x.length > 0).pop();

  // code.innerHTML = "<div class='author__container'><a class='link' href='https://github.com/mishrole' target='_blank'>Mitchell Rodríguez @mishrole</a></div>";

  if (url.includes("platzi.com/cursos") && courseId) {
    await paintUI(courseId);
  } else {
    popupCoursesContainer.innerHTML = "<p style='padding:1em 0.8em 1.2em'>Navega hacia un curso en <a class='link' href='https://platzi.com/cursos/' target='_blank'>Platzi</a> para ver tu progreso. Prueba el <a class='link' href='https://platzi.com/cursos/programacion-basica/' target='_blank'>Curso de Programación Básica</a></p>";
  }

  chrome.runtime.onMessage.addListener(async (object, _sender, _sendResponse) => {
    const { type } = object;

    if (type === "REPAINT") {
      console.log('repaint');
      await paintUI(courseId);
    }
  });

  btnReload.addEventListener('click', () => {
    // Clear storage
    // chrome.storage.sync.clear();

    // Send message to contentScript.js to collect data again
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "COLLECT" });
    });
  });

});

// UI

const paintUI = async (courseId) => {
  await fetchCurrentSavedCourseData(courseId).then(data => {
    if (data.length > 0) {
      console.warn(data);
      showCourses(data);
    } else {
      popupCoursesContainer.innerHTML = 'No hay datos que mostrar. Presiona el botón "Recargar" para actualizar los datos.';
    }
  });
}

const showCourses = (data) => {
  popupCoursesContainer.innerHTML = "";
  console.warn(data);

  data.forEach(course => {
    createCourseCard(course, popupCoursesContainer);
  });
  
}