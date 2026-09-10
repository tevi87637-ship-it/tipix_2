import { courseSelection } from "../lib/studentProfile.js";
export type Question = {
  id: string;
  concept: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};
export type Course = {
  id: string;
  name: string;
  theme: string;
  description: string;
  chapter: string;
  concepts: string[];
  lesson: string;
  questions: Question[];
};
const q = (
  id: string,
  concept: string,
  prompt: string,
  options: string[],
  answer: number,
  explanation: string,
): Question => ({ id, concept, prompt, options, answer, explanation });
export function getCourses(grade: string, stream: string): Course[] {
  const g = Number(grade);
  const math: Course = {
    id: "mathematics",
    name: "Mathematics",
    theme: "violet",
    description: "Find the patterns. Build the reasoning.",
    chapter:
      g === 12
        ? "Matrices"
        : g === 11
          ? "Sets"
          : g >= 9
            ? "Algebra foundations"
            : "Number sense",
    concepts:
      g === 12
        ? ["Order of a matrix", "Matrix entries", "Matrix addition"]
        : g === 11
          ? ["Set notation", "Union and intersection", "Subsets"]
          : g >= 9
            ? ["Expressions", "Linear equations", "Substitution"]
            : ["Operations", "Fractions", "Ratios"],
    lesson:
      g === 12
        ? "A matrix arranges numbers in rows and columns. Its order is written as rows × columns. Add matrices of the same order by adding corresponding entries."
        : g === 11
          ? "A set is a well-defined collection of distinct objects. The union of two sets contains elements in either set; their intersection contains only elements shared by both."
          : g >= 9
            ? "An expression describes a quantity using numbers and variables. To solve an equation, apply the same operation to both sides. Substitution replaces a variable with a known value."
            : "Choose operations carefully. Multiplication and division come before addition and subtraction unless brackets change the order. Fractions describe equal parts of a whole.",
    questions:
      g === 12
        ? [
            q(
              "m1",
              "Order of a matrix",
              "A matrix has 2 rows and 3 columns. What is its order?",
              ["3 × 2", "2 × 3", "2 × 2", "3 × 3"],
              1,
              "Order is rows × columns, so the order is 2 × 3.",
            ),
            q(
              "m2",
              "Matrix entries",
              "In A = [[2, 5], [7, 9]], what is the entry in row 2, column 1?",
              ["2", "5", "7", "9"],
              2,
              "The second row is [7, 9]. Its first entry is 7.",
            ),
            q(
              "m3",
              "Matrix addition",
              "What is [[1, 2]] + [[3, 4]]?",
              ["[[4, 6]]", "[[3, 8]]", "[[1, 2, 3, 4]]", "Not defined"],
              0,
              "Add matching entries: 1 + 3 = 4 and 2 + 4 = 6.",
            ),
            q(
              "m4",
              "Matrix addition",
              "Can a 2 × 3 matrix be added to a 3 × 2 matrix?",
              [
                "Yes, always",
                "Only if both contain zeros",
                "No, their orders differ",
                "Only if entries are positive",
              ],
              2,
              "Matrix addition requires the same number of rows and columns.",
            ),
          ]
        : g === 11
          ? [
              q(
                "m1",
                "Set notation",
                "Which set lists the distinct letters in “LEVEL”?",
                ["{L, E, V, E, L}", "{L, E, V}", "{LEVEL}", "{L, V}"],
                1,
                "Sets do not repeat elements. The distinct letters are L, E, and V.",
              ),
              q(
                "m2",
                "Union and intersection",
                "If A = {1, 2} and B = {2, 3}, what is A ∪ B?",
                ["{2}", "{1, 3}", "{1, 2, 3}", "{}"],
                2,
                "The union contains every distinct element that belongs to A or B.",
              ),
              q(
                "m3",
                "Union and intersection",
                "For A = {1, 2} and B = {2, 3}, what is A ∩ B?",
                ["{2}", "{1, 2, 3}", "{1, 3}", "{}"],
                0,
                "The only shared element is 2, so the intersection is {2}.",
              ),
              q(
                "m4",
                "Subsets",
                "How many subsets does {a, b} have?",
                ["2", "3", "4", "8"],
                2,
                "The subsets are {}, {a}, {b}, and {a, b}. A set with n elements has 2ⁿ subsets.",
              ),
            ]
          : g >= 9
            ? [
                q(
                  "m1",
                  "Expressions",
                  "Simplify 3x + 2x.",
                  ["5x", "6x", "5x²", "x"],
                  0,
                  "Like terms combine by adding their coefficients: 3 + 2 = 5.",
                ),
                q(
                  "m2",
                  "Linear equations",
                  "Solve 2x + 4 = 10.",
                  ["2", "3", "5", "7"],
                  1,
                  "Subtract 4 from each side to get 2x = 6, then divide by 2.",
                ),
                q(
                  "m3",
                  "Substitution",
                  "If x = 3, what is x² + 1?",
                  ["7", "9", "10", "12"],
                  2,
                  "3² + 1 = 9 + 1 = 10.",
                ),
                q(
                  "m4",
                  "Linear equations",
                  "Solve x / 4 = 5.",
                  ["1", "9", "20", "25"],
                  2,
                  "Multiply both sides by 4: x = 20.",
                ),
              ]
            : [
                q(
                  "m1",
                  "Operations",
                  "What is 6 + 4 × 3?",
                  ["30", "18", "24", "15"],
                  1,
                  "Multiply first: 4 × 3 = 12. Then 6 + 12 = 18.",
                ),
                q(
                  "m2",
                  "Fractions",
                  "What is one half of 18?",
                  ["6", "8", "9", "12"],
                  2,
                  "One half means divide by 2. 18 ÷ 2 = 9.",
                ),
                q(
                  "m3",
                  "Ratios",
                  "There are 2 red and 4 blue counters. What is the red-to-blue ratio in simplest form?",
                  ["2:1", "1:2", "1:3", "2:3"],
                  1,
                  "2:4 simplifies to 1:2 by dividing both parts by 2.",
                ),
                q(
                  "m4",
                  "Fractions",
                  "Which fraction equals 0.25?",
                  ["1/2", "1/3", "1/4", "3/4"],
                  2,
                  "0.25 is 25/100, which simplifies to 1/4.",
                ),
              ],
  };
  const physics: Course = {
    id: "physics",
    name: "Physics",
    theme: "blue",
    description: "Make sense of motion, energy, and matter.",
    chapter: g === 12 ? "Electric charge" : "Motion in a straight line",
    concepts:
      g === 12
        ? ["Charge interactions", "Conservation of charge", "Current"]
        : ["Distance and displacement", "Average speed", "Acceleration"],
    lesson:
      g === 12
        ? "Like electric charges repel and unlike charges attract. Electric charge is conserved: it can transfer between objects, but is not created or destroyed in an isolated system. Electric current is charge flowing per unit time."
        : "Distance measures the total path travelled. Displacement measures the change from starting position to final position, including direction. Average speed is total distance divided by total time. Acceleration describes how velocity changes over time.",
    questions:
      g === 12
        ? [
            q(
              "p1",
              "Charge interactions",
              "Two positive charges are brought near each other. What happens?",
              [
                "They attract",
                "They repel",
                "They disappear",
                "They become neutral",
              ],
              1,
              "Like charges repel. Opposite charges attract.",
            ),
            q(
              "p2",
              "Conservation of charge",
              "An object gains electrons. Its net charge becomes more…",
              ["positive", "negative", "massive", "neutral in every case"],
              1,
              "Electrons carry negative charge, so gaining electrons makes the net charge more negative.",
            ),
            q(
              "p3",
              "Current",
              "A charge of 6 C passes in 3 s. What is the current?",
              ["2 A", "3 A", "9 A", "18 A"],
              0,
              "Current = charge ÷ time = 6 ÷ 3 = 2 A.",
            ),
            q(
              "p4",
              "Charge interactions",
              "Which is the SI unit of electric charge?",
              ["Volt", "Ampere", "Coulomb", "Ohm"],
              2,
              "Electric charge is measured in coulombs (C).",
            ),
          ]
        : [
            q(
              "p1",
              "Average speed",
              "A bicycle travels 60 m in 5 s. What is its average speed?",
              ["5 m/s", "12 m/s", "30 m/s", "60 m/s"],
              1,
              "Average speed = distance ÷ time = 60 ÷ 5 = 12 m/s.",
            ),
            q(
              "p2",
              "Distance and displacement",
              "You walk 5 m east, then 5 m west. What is your displacement?",
              ["10 m east", "5 m west", "0 m", "10 m west"],
              2,
              "You return to your starting point, so the displacement is zero.",
            ),
            q(
              "p3",
              "Acceleration",
              "Velocity increases from 2 m/s to 10 m/s in 4 s. Find the average acceleration.",
              ["2 m/s²", "3 m/s²", "8 m/s²", "40 m/s²"],
              0,
              "Average acceleration = change in velocity ÷ time = (10 − 2) ÷ 4 = 2 m/s².",
            ),
            q(
              "p4",
              "Distance and displacement",
              "A runner completes one 400 m lap. What distance has the runner travelled?",
              ["0 m", "200 m", "400 m", "800 m"],
              2,
              "Distance measures the entire path, so it is 400 m even though displacement is zero.",
            ),
          ],
  };
  const chemistry: Course = {
    id: "chemistry",
    name: "Chemistry",
    theme: "peach",
    description: "Look closer at the building blocks of everything.",
    chapter: "Atomic structure foundations",
    concepts: ["Particles", "Atomic number", "Ions"],
    lesson:
      "An atom contains a positively charged nucleus with protons and usually neutrons. Electrons carry negative charge. The atomic number is the number of protons. A neutral atom has equal numbers of protons and electrons.",
    questions: [
      q(
        "c1",
        "Particles",
        "Which particle carries a negative charge?",
        ["Proton", "Neutron", "Electron", "Nucleus"],
        2,
        "Electrons are negatively charged; protons are positive and neutrons are neutral.",
      ),
      q(
        "c2",
        "Atomic number",
        "An atom has 6 protons. What is its atomic number?",
        ["3", "6", "12", "18"],
        1,
        "Atomic number equals the number of protons.",
      ),
      q(
        "c3",
        "Ions",
        "A neutral atom loses one electron. What charge does it acquire?",
        ["−1", "0", "+1", "+2"],
        2,
        "Losing one negative charge leaves a net charge of +1.",
      ),
      q(
        "c4",
        "Particles",
        "Which particle has no net electric charge?",
        ["Electron", "Proton", "Neutron", "Positive ion"],
        2,
        "A neutron is electrically neutral.",
      ),
    ],
  };
  const biology: Course = {
    id: "biology",
    name: "Biology",
    theme: "green",
    description: "Explore life, one connected system at a time.",
    chapter: "Cell foundations",
    concepts: ["Cell structures", "Photosynthesis", "Cell membrane"],
    lesson:
      "Cells are the basic structural and functional units of life. The cell membrane controls movement into and out of a cell. Plant cells can contain chloroplasts, where photosynthesis uses light energy to help make sugars.",
    questions: [
      q(
        "b1",
        "Cell structures",
        "What is the basic structural unit of living organisms?",
        ["Atom", "Cell", "Organ", "Tissue"],
        1,
        "The cell is the basic structural and functional unit of life.",
      ),
      q(
        "b2",
        "Photosynthesis",
        "Which plant-cell structure is associated with photosynthesis?",
        ["Chloroplast", "Ribosome", "Cell wall", "Nucleolus"],
        0,
        "Chloroplasts contain chlorophyll and are the site of photosynthesis.",
      ),
      q(
        "b3",
        "Cell membrane",
        "Which structure regulates movement into and out of a cell?",
        ["Cell membrane", "Chromosome", "Nucleolus", "Chlorophyll"],
        0,
        "The selectively permeable cell membrane helps regulate exchange.",
      ),
      q(
        "b4",
        "Cell structures",
        "Which structure is generally present in plant cells but absent in animal cells?",
        ["Cell membrane", "Cytoplasm", "Cell wall", "Ribosome"],
        2,
        "Plant cells have a cell wall outside the membrane; animal cells do not.",
      ),
    ],
  };
  const science: Course = {
    id: "science",
    name: "Science",
    theme: "green",
    description: "Explore the physical and living world around you.",
    chapter: "Observation and measurement",
    concepts: ["Measurement", "Living systems", "Changes in matter"],
    lesson:
      "Science starts with observation and questions. Measurements need a number and a unit. Living systems are made of cells, and matter can change its physical state when energy is transferred.",
    questions: [
      q(
        "s1",
        "Measurement",
        "Which unit is used for measuring length?",
        ["Kilogram", "Metre", "Second", "Litre"],
        1,
        "The metre is the SI unit of length.",
      ),
      q(
        "s2",
        "Living systems",
        "Plants mainly absorb water through their…",
        ["flowers", "leaves", "roots", "fruits"],
        2,
        "Roots absorb water and dissolved minerals from the soil.",
      ),
      q(
        "s3",
        "Changes in matter",
        "Ice melting into liquid water is a…",
        [
          "physical change",
          "new element",
          "chemical combustion",
          "nuclear change",
        ],
        0,
        "Melting changes the physical state but the substance remains water.",
      ),
      q(
        "s4",
        "Measurement",
        "How many centimetres are in one metre?",
        ["10", "50", "100", "1,000"],
        2,
        "One metre equals 100 centimetres.",
      ),
    ],
  };
  const commerce: Course = {
    id: "commerce",
    name: "Commerce",
    theme: "gold",
    description: "Understand businesses and the choices they make.",
    chapter: "Business foundations",
    concepts: ["Revenue and profit", "Assets", "Trade"],
    lesson:
      "Revenue is income from sales before subtracting expenses. Profit is revenue minus expenses. An asset is a resource controlled by a business, and trade involves buying and selling goods or services.",
    questions: [
      q(
        "co1",
        "Revenue and profit",
        "Revenue is ₹1,000 and expenses are ₹700. What is the profit?",
        ["₹300", "₹700", "₹1,000", "₹1,700"],
        0,
        "Profit = revenue − expenses = ₹1,000 − ₹700 = ₹300.",
      ),
      q(
        "co2",
        "Assets",
        "Which is an example of a business asset?",
        [
          "An unpaid electricity expense",
          "Equipment owned by the business",
          "A bank loan owed",
          "An outstanding supplier bill",
        ],
        1,
        "Equipment owned by a business is a resource it controls and uses.",
      ),
      q(
        "co3",
        "Trade",
        "Trade primarily involves…",
        [
          "only making goods",
          "buying and selling goods or services",
          "only paying taxes",
          "only saving money",
        ],
        1,
        "Trade concerns the buying and selling of goods or services.",
      ),
      q(
        "co4",
        "Revenue and profit",
        "If expenses exceed revenue, the business makes a…",
        [
          "profit",
          "loss",
          "dividend automatically",
          "capital gain automatically",
        ],
        1,
        "Expenses greater than revenue produce a loss.",
      ),
    ],
  };
  return [math, science, physics, chemistry, biology, commerce].filter((c) =>
    courseSelection(grade, stream).includes(c.name),
  );
}
