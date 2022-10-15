(async () => {

  let currentCourse = {
    courseId: "",
    mainTitle: "",
    url: ""
  };
  
  let currentCourses = [];

  chrome.runtime.onMessage.addListener(async (object, _sender, _sendResponse) => {
    const { type, value, courseId, mainTitle, url } = object;

    // →
    if (type === "NEW") {
      currentCourse.courseId = courseId;
      currentCourse.mainTitle = mainTitle;
      currentCourse.url = url;
      currentCourse.value = value;
      newCourseLoaded();
    }
    // →
    if (type === "COLLECT") {
      await newCourseLoaded().then(() => {
        console.log('contentScript data sended');
        // ←
        chrome.runtime.sendMessage({ type: "REPAINT" });
      });
    }
  });

  const newCourseLoaded = async () => {
    currentCourses = await fetchCurrentSavedCourseData();
    addNewCourseEventHandler();
  };

  const fetchCurrentSavedCourseData = () => {
    return new Promise((resolve, _reject) => {
      chrome.storage.local.get([currentCourse.courseId], (data) => {
        resolve(data[currentCourse.courseId] ? JSON.parse(data[currentCourse.courseId]) : []);
      });
    });
  }

  const addNewCourseEventHandler = async () => {
    const currentDate = new Date();
    const data = await collectedCourseData();
    const newCourse = {
      ...data,
      time: currentDate.getTime(),
      lastAccess: "Last access: " + currentDate.toLocaleDateString() + " " + currentDate.toLocaleTimeString(),
    }

    // currentCourses = await fetchCurrentSavedCourseData();

    // chrome.storage.local.set({
    //   [currentCourse.courseId]: JSON.stringify([...currentCourses, newCourse].sort((a,b) => a.time - b.time))
    // });

    setNewCourseOnStorage(currentCourse.courseId, newCourse);
  }

  const setNewCourseOnStorage = async (courseId, newCourse) => {
    currentCourses = await fetchCurrentSavedCourseData();

    if (!isCourseDuplicated(currentCourses, newCourse)) {
      chrome.storage.local.set({
        [courseId]: JSON.stringify([...currentCourses, newCourse].sort((a,b) => a.time - b.time))
      });
    } else {
      // Modify specific course on chrome storage by courseId
      const currentCourseIndex = currentCourses.findIndex(course => course.courseId === newCourse.courseId);
      currentCourses[currentCourseIndex] = newCourse;

      chrome.storage.local.set({
        [courseId]: JSON.stringify([...currentCourses].sort((a,b) => a.time - b.time))
      });
    }
  }

  const collectedCourseData = async () => {
    const courseName = document.querySelector(".Hero-content-title").innerText;
    const teacherName = document.querySelector(".TeacherDetails-name").innerText;
    const teacherUrl = document.querySelector(".test-courseTeachersCTA").href;
    const courseBadgeContainer = document.querySelector(".Hero-badge");
    const courseBadge = courseBadgeContainer.querySelector("img").src;
  
    // Get classes
    const classesContainer = document.querySelector(".Content-feed");
    const modules = classesContainer.querySelectorAll(".ContentBlock");
  
    let data = [];
  
    if (modules.length > 0) {
      data = Array.from(modules).map((item, index) => {
        const moduleTitle = item.querySelector(".ContentBlock-head-title").innerText;
        const classesList = item.querySelector(".ContentBlock-list");
        const classesListItem = classesList.querySelectorAll(".ContentBlock-list-item");
  
        let content = [];
  
        if (classesListItem.length > 0) {
          content = Array.from(classesListItem).map((item, index) => {
            const isClassContainer = item.querySelector(".ContentClass");
    
            if (isClassContainer) {
              const itemContainer = item.querySelector(".ContentClass-item-link");
              const watched = itemContainer.classList.contains("is-seen");
              const contentContainer = itemContainer.querySelector(".ContentClass-item-content");
              const contentTitle = contentContainer.querySelector("h5").innerText;
              const contentTime = contentContainer.querySelector("p").innerText;
    
              const currentClass = {
                id: index,
                title: contentTitle,
                time: contentTime,
                type: "class",
                watched
              }
    
              return currentClass;
            } else {
              const quizTitleContainer = item.querySelector(".ContentQuiz-item-content");
              const quizTitle = quizTitleContainer.querySelector("h5").innerText;
    
              const currentQuiz = {
                id: index,
                title: quizTitle,
                type: "quiz",
              }
    
              return currentQuiz;
            }
    
          });
        }
  
        const currentModule = {
          id: index,
          title: moduleTitle,
          content
        };
  
        return currentModule;
      });
    }
    
    const course = {
      ...currentCourse,
      title: courseName,
      badge: courseBadge,
      teacher: {
        name: teacherName,
        url: teacherUrl
      },
      data
    };
  
    return course;
  }

  const isCourseDuplicated = (savedCourses, newCourse) => {

    let coincidences = 0;
  
    if (savedCourses.length > 0) {
      savedCourses.filter(savedCourse => {
        if(savedCourse.courseId === newCourse.courseId) {
            coincidences++;
        }
      });
    }
  
    return coincidences > 0;
  }

})();