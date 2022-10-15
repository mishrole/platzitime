const getFormattedSeconds = (seconds) => new Date(seconds * 1000).toISOString().substring(11, 19);

const getTransformedTime = (time) => {
  // Time has format: 10:30 min
  const extractMinutesAndSeconds = time.slice(0, time.length - 4);
  const [stringMinutes, stringSeconds] = extractMinutesAndSeconds.split(":");

  const exceededHours = Number(stringMinutes) >= 59 ? Math.floor(Number(stringMinutes) / 60) : 0; 
  const exceededMinutes = Number(stringMinutes) % 60;

  let timeExtract;

  if (exceededHours > 0) {

    timeExtract = `${exceededHours}:${exceededMinutes}:${stringSeconds}`;

    if (exceededHours.length === 1) {
      timeExtract = `0${timeExtract}`;
    }

  } else {
    timeExtract = `00:${stringMinutes}:${stringSeconds}`;
  }

  return new Date(`1970-01-01 ${timeExtract}`); // target
  //console.log(`Minutes: ${target.getMinutes()} | Seconds: ${target.getSeconds()}`)
}

const getCalculatedCourseTime = (course) => {
  let totalSeconds = 0;
  let totalSecondsWatched = 0;
  let totalSecondsNotWatched = 0;
  let modulesSeconds = [];

  course.data.forEach((module) => {
    let totalModuleSecondsWatched = 0;
    let totalModuleSecondsNotWatched = 0;

    const totalModuleSeconds = module.content.reduce((accTotalSeconds, content) => {

      // Get total seconds of module content
      if (content.type === "class") {
        const classTime = getTransformedTime(content.time);
        const classTimeInSeconds = classTime.getHours() * 3600 + classTime.getMinutes() * 60 + classTime.getSeconds();

        accTotalSeconds += classTimeInSeconds;

        if (content.watched) {
          totalModuleSecondsWatched += classTimeInSeconds;
          totalSecondsWatched += classTimeInSeconds;
        } else {
          totalModuleSecondsNotWatched += classTimeInSeconds;
          totalSecondsNotWatched += classTimeInSeconds;
        }

      }
      return accTotalSeconds;
    }, 0);

    totalSeconds += totalModuleSeconds;

    modulesSeconds.push({
      title: module.title,
      total: getFormattedSeconds(totalModuleSeconds),
      watched: getFormattedSeconds(totalModuleSecondsWatched),
      notWatched: getFormattedSeconds(totalModuleSecondsNotWatched),
      percentageWatched: Math.round((totalModuleSecondsWatched / totalModuleSeconds) * 100),
    });
  });

  return {
    total: getFormattedSeconds(totalSeconds),
    watched: getFormattedSeconds(totalSecondsWatched),
    notWatched: getFormattedSeconds(totalSecondsNotWatched),
    percentageWatched: Math.round((totalSecondsWatched / totalSeconds) * 100),
    modules: modulesSeconds
  }

}

const copyRichText = async (content) => {
  const blob = new Blob([content], { type: "text/html" });
  const richTextInput = new ClipboardItem({ "text/html": blob });
  await navigator.clipboard.write([richTextInput]);
};

const copyToClipboard = (content) => {
  navigator.clipboard.writeText(content)
  .then(() => {
    alert(content);
    console.log('Text copied to clipboard');
  })
  .catch(err => {
    console.error('Something went wrong', err);
  });
}


// * Exported

export const fetchCurrentSavedCourseData = (courseId) => {
  return new Promise((resolve, _reject) => {
    chrome.storage.local.get([courseId], (data) => {
      resolve(data[courseId] ? JSON.parse(data[courseId]) : []);
    });
  });
}

export async function getCurrentActiveTabURL() {
  const queryOptions = { active: true, currentWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

export const isCourseDuplicated = (savedCourses, newCourse) => {

  let coincidences = 0;

  savedCourses.filter(savedCourse => {
      if(savedCourse.id === newCourse.id) {
          coincidences++;
      }
  })

  return coincidences > 0;
}

export const createModulesList = (modules, courseContainer) => {
  if (modules.length > 0) {
    const modulesList = document.createElement("ul");
    modulesList.classList.add("modules__list");

    modules.forEach((module) => {
      const moduleItem = document.createElement("li");
      moduleItem.classList.add("modules__item");

      const moduleItemContainer = document.createElement("div");

      const moduleTitle = document.createElement("h5");
      moduleTitle.classList.add("modules__title");
      moduleTitle.textContent = module.title;

      const modulePendingTime = document.createElement("span");
      modulePendingTime.classList.add("modules__pending-time");
      modulePendingTime.textContent = `Pendiente: ${module.notWatched}`;

      const modulePercentageWatched = document.createElement("span");
      modulePercentageWatched.classList.add("modules__percentage-watched");
      modulePercentageWatched.textContent = `${module.percentageWatched}%`;

      const moduleCalculatedContainer = document.createElement("div");
      moduleCalculatedContainer.classList.add("modules__calculated-container");
      moduleCalculatedContainer.append(modulePendingTime, modulePercentageWatched);

      moduleItemContainer.append(moduleTitle, moduleCalculatedContainer);
      moduleItem.appendChild(moduleItemContainer);
      modulesList.appendChild(moduleItem);
    });



    courseContainer.append(modulesList);
  }
}

export const createCourseCard = (course, coursesContainer) => {
  const calculatedCourseTime = getCalculatedCourseTime(course);

  const courseCard = document.createElement('div');
  courseCard.className = "courses__container";

  const courseFigure = document.createElement('div');
  courseFigure.className = "courses__item__figure";
  const courseBadgeContainer = document.createElement('div');
  courseBadgeContainer.className = "courses__item__badge";
  const courseBadge = document.createElement('img');
  courseBadge.src = course.badge;
  courseBadgeContainer.appendChild(courseBadge);
  courseFigure.appendChild(courseBadgeContainer);


  const courseTitleContainer = document.createElement('div');
  courseTitleContainer.className = "courses__item__title";
  const courseName = document.createElement('p');
  courseName.textContent = course.title;

  const courseTeacher = document.createElement('p');
  courseTeacher.textContent = course.teacher.name;

  const progressContainer = document.createElement('div');

  const courseTotalTime = document.createElement('p');
  courseTotalTime.textContent = `Total: ${calculatedCourseTime.total}`;

  const courseWatchedTime = document.createElement('p');
  courseWatchedTime.textContent = `Completado: ${calculatedCourseTime.watched} (${calculatedCourseTime.percentageWatched}%)`;

  const courseNotWatchedTime = document.createElement('p');
  courseNotWatchedTime.textContent = `Pendiente: ${calculatedCourseTime.notWatched}`;

  progressContainer.append(courseWatchedTime, courseNotWatchedTime, courseTotalTime);

  const clipboardButton = document.createElement('button');
  clipboardButton.type = "button";
  clipboardButton.className = "icon-clipboard copy__button";

  courseTitleContainer.append(courseName, courseTeacher, progressContainer);

  clipboardButton.addEventListener('click', () => {
    copyRichText(courseTitleContainer.innerHTML);
  });

  const courseOpenContainer = document.createElement('div');
  courseOpenContainer.className = "courses__item__checkbox"
  // const courseOpenButton = document.createElement('button');
  // courseOpenButton.type = "button";
  // const courseOpenIcon = document.createElement('span');
  // courseOpenIcon.className = "icon-arrow-down"
  // courseOpenButton.appendChild(courseOpenIcon);
  // courseOpenContainer.appendChild(courseOpenButton);
  courseOpenContainer.appendChild(clipboardButton);

  const courseItemHeader = document.createElement('div');
  courseItemHeader.className = "courses__item";
  courseItemHeader.append(courseBadgeContainer, courseTitleContainer, courseOpenContainer);

  courseCard.append(courseItemHeader);

  // UI modules list
  createModulesList(calculatedCourseTime.modules, courseCard);

  coursesContainer.appendChild(courseCard);
}

export const wait = function (milliseconds) {
  return new Promise(function(resolve) {
      setTimeout(function() {
          resolve();
      }, milliseconds);
  });
}

export const autoScroll = async (scrollTo) => {
  const element = document.querySelector(scrollTo);

  if(element) {
      window.scrollTo({
          top: element.scrollHeight,
          left: 0,
          behavior: 'smooth'
      });
  }

  return new Promise(function(resolve) {
      resolve();
  });
}