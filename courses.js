// Course data. To add an instructor or course, copy an entry below.
// items are listed in the order they happen in the semester (order matters for weight shifting).
// type "quiz" items form one pool: only the best (count - drop) quizzes are counted.
window.GC_DATA = {
  capPct: 65, // largest weight any single assessment may reach after a shift
  letterScale: [
    [95, "A"], [90, "A-"], [86, "B+"], [83, "B"], [80, "B-"],
    [76, "C+"], [73, "C"], [70, "C-"], [60, "D"], [0, "F"]
  ],
  instructors: [
    {
      id: "hamade",
      name: "Alaa Hamade",
      courses: [
        {
          id: "mgt201",
          code: "MGT 201",
          quizPool: { drop: 2, totalWeight: 5 }, // 7 quizzes, best 5 count, worth 5% in total
          items: [
            { id: "q1", label: "Quiz 1", type: "quiz", points: 20, weight: 1, canMiss: true },
            { id: "q2", label: "Quiz 2", type: "quiz", points: 20, weight: 1, canMiss: true },
            { id: "e1", label: "Exam 1", type: "exam", points: 80, weight: 20, canMiss: true },
            { id: "q3", label: "Quiz 3", type: "quiz", points: 20, weight: 1, canMiss: true },
            { id: "q4", label: "Quiz 4", type: "quiz", points: 20, weight: 1, canMiss: true },
            { id: "e2", label: "Exam 2", type: "exam", points: 100, weight: 25, canMiss: true },
            { id: "q5", label: "Quiz 5", type: "quiz", points: 20, weight: 1, canMiss: true },
            { id: "q6", label: "Quiz 6", type: "quiz", points: 20, weight: 1, canMiss: true },
            { id: "q7", label: "Quiz 7", type: "quiz", points: 20, weight: 1, canMiss: true },
            { id: "proj", label: "Project", type: "project", points: 100, weight: 25, canMiss: true },
            { id: "final", label: "Final Exam", type: "exam", points: 75, weight: 25, canMiss: false }
          ]
        }
      ]
    }
  ]
};
