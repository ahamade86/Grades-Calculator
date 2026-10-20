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
        ,{
          id: "bus100",
          code: "BUS 100",
          quizPool: { drop: 2, totalWeight: 10 }, // 7 quizzes, best 5 count at 2% each
          items: [
            { id: "q1", label: "Quiz 1", type: "quiz", points: 20, weight: 2, canMiss: true },
            { id: "ica1", label: "ICA 1", type: "ica", points: 100, weight: 6, canMiss: true },
            { id: "q2", label: "Quiz 2", type: "quiz", points: 20, weight: 2, canMiss: true },
            { id: "ica2", label: "ICA 2", type: "ica", points: 100, weight: 6, canMiss: true },
            { id: "q3", label: "Quiz 3", type: "quiz", points: 20, weight: 2, canMiss: true },
            { id: "e1", label: "Exam 1", type: "exam", points: 40, weight: 20, canMiss: true },
            { id: "q4", label: "Quiz 4", type: "quiz", points: 20, weight: 2, canMiss: true },
            { id: "ica3", label: "ICA 3", type: "ica", points: 100, weight: 6, canMiss: true },
            { id: "ica4", label: "ICA 4", type: "ica", points: 100, weight: 6, canMiss: true },
            { id: "q5", label: "Quiz 5", type: "quiz", points: 20, weight: 2, canMiss: true },
            { id: "q6", label: "Quiz 6", type: "quiz", points: 20, weight: 2, canMiss: true },
            { id: "e2", label: "Exam 2", type: "exam", points: 40, weight: 20, canMiss: true },
            { id: "q7", label: "Quiz 7", type: "quiz", points: 20, weight: 2, canMiss: true },
            { id: "ica5", label: "ICA 5", type: "ica", points: 100, weight: 6, canMiss: true },
            { id: "final", label: "Final Exam", type: "exam", points: 80, weight: 20, canMiss: false }
          ]
        },
        {
          id: "ien301",
          code: "IEN 301",
          items: [
            { id: "p1", label: "Project 1", type: "project", points: 100, weight: 20, canMiss: true },
            { id: "q1", label: "Quiz 1", type: "quiz", points: 15, weight: 5, canMiss: true },
            { id: "q2", label: "Quiz 2", type: "quiz", points: 15, weight: 5, canMiss: true },
            { id: "p2", label: "Project 2", type: "project", points: 100, weight: 20, canMiss: true },
            { id: "q3", label: "Quiz 3", type: "quiz", points: 15, weight: 5, canMiss: true },
            { id: "p3", label: "Project 3", type: "project", points: 100, weight: 30, canMiss: true },
            // reflection points were not specified, 100 is a placeholder: edit here
            { id: "r1", label: "Reflection 1", type: "reflection", points: 100, weight: 5, canMiss: true },
            { id: "r2", label: "Reflection 2", type: "reflection", points: 100, weight: 5, canMiss: true },
            { id: "r3", label: "Reflection 3", type: "reflection", points: 100, weight: 5, canMiss: false }
          ]
        },
        {
          id: "bis101",
          code: "BIS 101",
          items: [
            { id: "c1", label: "Case 1", type: "case", points: 100, weight: 3, canMiss: true },
            { id: "c2", label: "Case 2", type: "case", points: 100, weight: 3, canMiss: true },
            { id: "c3", label: "Case 3", type: "case", points: 100, weight: 3, canMiss: true },
            { id: "e1", label: "Exam 1", type: "exam", points: 40, weight: 20, canMiss: true },
            { id: "c4", label: "Case 4", type: "case", points: 100, weight: 3, canMiss: true },
            { id: "e2", label: "Exam 2", type: "exam", points: 40, weight: 20, canMiss: true },
            { id: "c5", label: "Case 5", type: "case", points: 100, weight: 3, canMiss: true },
            { id: "e3", label: "Exam 3", type: "exam", points: 40, weight: 20, canMiss: true },
            { id: "proj", label: "Project", type: "project", points: 25, weight: 25, canMiss: false }
          ]
        }
      ]
    },
    {
      id: "khawaja",
      name: "Ali Khawaja",
      tracker: true // open grade tracker, no course selection needed
    }
  ]
};
