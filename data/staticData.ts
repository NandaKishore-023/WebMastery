
export interface TopicData {
  content: string;
  summary: string;
  quiz: string;
}

// Helper to generate placeholder content for topics that don't have manual entries yet
// This ensures the site feels "full" even if we haven't manually written 200+ topics in this file.
const generatePlaceholder = (title: string, chapter: string) => `
# ${title}

**Chapter:** ${chapter}

## Introduction
Welcome to the detailed study of **${title}**. In this section, we will explore the fundamental concepts, practical applications, and core principles that define this topic.

## Core Concepts
1. **Definition**: Understanding exactly what ${title} entails in the context of modern technology.
2. **Importance**: Why this specific topic matters in the industry today.
3. **Application**: Real-world scenarios where these concepts are applied.

### Key Features
* Feature 1: Essential component of the subject.
* Feature 2: Interacts with other modules in the system.
* Feature 3: Critical for performance and optimization.

## Detailed Explanation
The ${title} is a crucial part of the ${chapter}. When working with this, it is important to remember that consistency and logical structure are key.

> **Note:** This is a static placeholder for demonstration. In a production environment, this would contain the specific textbook definitions, code examples, and diagrams for "${title}".

## Conclusion
To summarize, ${title} plays a pivotal role in the broader scope of this subject. Mastery of this concept is essential for professional development.
`;

const generatePlaceholderSummary = (title: string) => `
## Summary: ${title}

**Overview**
A quick recap of the core principles behind ${title}.

**Key Takeaways**
* Understanding the definition and scope.
* Recognizing the three main features.
* Applying the knowledge to real-world problems.

**Conclusion**
${title} is a foundational block of the curriculum.
`;

const generatePlaceholderQuiz = (title: string) => `
**Q1. What is the primary purpose of ${title}?**
- A. To confuse students
- B. To optimize performance and structure
- C. To delete data
- D. None of the above
<details><summary>View Answer</summary>Correct Answer: B</details>
---
**Q2. Which feature is most critical to ${title}?**
- A. The red color
- B. The sound it makes
- C. Its logical integration
- D. The price
<details><summary>View Answer</summary>Correct Answer: C</details>
---
**Q3. Is ${title} considered a fundamental concept?**
- A. Yes, absolutely
- B. No, it is optional
- C. Only on Tuesdays
- D. Depends on the weather
<details><summary>View Answer</summary>Correct Answer: A</details>
`;

// MANUAL CONTENT ENTRIES
export const STATIC_CONTENT_MAP: Record<string, TopicData> = {
  // --- WEB DESIGNING EXAMPLES ---
  "1.1": {
    content: `
# 1.1 Describe the anatomy of web page

## Introduction
A web page is a document that is suitable for the World Wide Web and web browsers. A web browser displays a web page on a monitor or mobile device.

## The Main Components
The anatomy of a web page generally consists of the following structure:

1. **Header**: Usually contains the logo, navigation menu, and sometimes a search bar. It appears at the top of every page.
2. **Navigation Bar (Nav)**: Links to the main sections of the site.
3. **Main Content**: The primary information of the specific page.
4. **Sidebar**: Secondary content, ads, or navigation links, usually on the left or right.
5. **Footer**: Contains copyright info, contact links, and legal disclaimers. Located at the bottom.

## HTML Structure
In terms of code, the anatomy is defined by HTML tags:

\`\`\`html
<!DOCTYPE html>
<html>
  <head>
    <title>Page Title</title>
  </head>
  <body>
    <header>Logo & Nav</header>
    <main>Main Content Here</main>
    <footer>Copyright Info</footer>
  </body>
</html>
\`\`\`

## Visual Layout
* **Margins**: Space outside elements.
* **Padding**: Space inside elements.
* **Borders**: Lines around elements.
    `,
    summary: `
## Summary: Anatomy of a Web Page

**Overview**
A web page is structured into distinct logical sections that help users navigate and consume content efficiently.

**Key Takeaways**
* **Header/Footer**: Consistent elements at top and bottom.
* **Main**: The unique content of the page.
* **HTML**: The underlying code that defines this structure.

**Conclusion**
Understanding the anatomy is the first step in becoming a Web Designer.
    `,
    quiz: `
**Q1. Which element is typically found at the bottom of a web page?**
- A. Header
- B. Sidebar
- C. Footer
- D. Navbar
<details><summary>View Answer</summary>Correct Answer: C</details>
---
**Q2. Which HTML tag contains the visible page content?**
- A. &lt;head&gt;
- B. &lt;body&gt;
- C. &lt;footer&gt;
- D. &lt;meta&gt;
<details><summary>View Answer</summary>Correct Answer: B</details>
    `
  },
  
  // --- PYTHON EXAMPLES ---
  "p1.1": {
    content: `
# 1.1 Define IOT (Internet of Things)

## Definition
The **Internet of Things (IoT)** refers to the collective network of connected devices and the technology that facilitates communication between devices and the cloud, as well as between the devices themselves.

## How it Works
IoT integrates everyday "things" with the internet. Computer chips and sensors are embedded in physical things to gather data and transmit it.

### Core Components
1. **Sensors/Devices**: Collect data (temperature, motion, etc.).
2. **Connectivity**: Sends data to the cloud (Wi-Fi, Bluetooth, 5G).
3. **Data Processing**: Making sense of the data.
4. **User Interface**: Dashboard for humans to visualize data.

## Example
A **Smart Thermostat** is a classic IoT example. It reads the temperature (Sensor), connects to your Wi-Fi (Connectivity), decides if it's too cold (Processing), and lets you change it via an App (UI).
    `,
    summary: `
## Summary: Internet of Things (IoT)

**Overview**
IoT connects physical objects to the digital world, allowing them to send and receive data.

**Key Takeaways**
* It bridges the physical and digital.
* Requires sensors, connectivity, and processing.
* Used in smart homes, agriculture, and industry.

**Conclusion**
IoT is the backbone of modern automation and smart technology.
    `,
    quiz: `
**Q1. What does IoT stand for?**
- A. Input of Technology
- B. Internet of Things
- C. Intranet of Tools
- D. Internet of Time
<details><summary>View Answer</summary>Correct Answer: B</details>
---
**Q2. Which is NOT a component of IoT?**
- A. Sensors
- B. Connectivity
- C. Magic
- D. User Interface
<details><summary>View Answer</summary>Correct Answer: C</details>
    `
  }
};

// Accessor function
export const getStaticContent = (topicId: string, topicTitle: string, chapterTitle: string): TopicData => {
  if (STATIC_CONTENT_MAP[topicId]) {
    return STATIC_CONTENT_MAP[topicId];
  }
  
  // Fallback for topics not manually filled
  return {
    content: generatePlaceholder(topicTitle, chapterTitle),
    summary: generatePlaceholderSummary(topicTitle),
    quiz: generatePlaceholderQuiz(topicTitle)
  };
};
