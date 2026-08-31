export interface JobOpening {
  id: string;
  title: string;
  company: string;
  grade?: string;
  description: string;
  responsibilities: string[];
  skills: {
    category?: string;
    items: string[];
  }[];
  experience: string[];
  offers: string[];
}

export const jobOpenings: JobOpening[] = [
  {
    id: "opening-a",
    title: "Founders Office Associate",
    company: "Satva Partners",
    description: `At Satva Partners (SP), we fuse dharmic wisdom with today's realities to build the next generation of Bharatiya business. We help businesses become investment-ready and work with leaders to realise their vision. Our work is designed to meet complexity with clarity, and help organisations and leaders grow on their own terms. We blend commercial acumen with Indian ethos, marrying ancient wisdom with global best practices. We see capital not merely as money, but through its timeless Sanskrit meaning of Artha – the source of abundance and impact. We approach our clients as partners, so our success lies in their success.`,
    responsibilities: [
      "Support Kabir on technical consulting engagements, performing a wide range of data analysis",
      "Development of strategic hypotheses, gathering data and research from primary and secondary sources",
      "Storyboarding and executing impactful, exec-ready presentations",
      "Co-lead planning and mobilisation of projects with Kabir, including documenting actions, follow-ups, and reporting on progress",
      "Act as a go-between for Kabir and other internal / client teams",
      "Accompany Kabir to events and assist where needed"
    ],
    skills: [
      {
        category: "Technical Skills",
        items: [
          "Good working knowledge of strategic problem-solving, particularly hypothesis development",
          "Data gathering and research, including primary and secondary sources",
          "Data analysis, data manipulation, and visual representation of data (including charts) using Excel and other tools"
        ]
      },
      {
        category: "Outcomes-Based Planning",
        items: [
          "Highly organised professional who can identify key outcomes in any given situation",
          "Outcomes-based planning, including documentation of milestones and estimation of timelines",
          "Plan tracking and progress reporting",
          "Delivery risk identification and mitigation"
        ]
      },
      {
        category: "Communication",
        items: [
          "Clear and succinct communication skills, both verbal and written",
          "Comfort presenting to senior executives and addressing critical questions",
          "Excellent storyboarding and written communication skills, using PowerPoint and Word"
        ]
      }
    ],
    experience: [
      "Minimum bachelor's degree from a reputed institute",
      "2-3 years of corporate experience in a Tier-1 organisation",
      "Starter-finisher, taking ownership and delivering outcomes, not just tasks",
      "Hyper-focused on learning and self-improvement",
      "Entrepreneurial and commercially savvy",
      "Emotional resilience, maturity and professionalism, demonstrating gravitas and engendering trust",
      "Comfortable navigating ambiguity with clients"
    ],
    offers: [
      "Joining at the start of our growth journey – unlimited growth opportunities, including financial, experiential, and network-driven",
      "True independence and leadership in a dharmic, purpose-driven team",
      "Travel opportunities within India and overseas",
      "Direct mentorship and guidance from Kabir",
      "Competitive CTC"
    ]
  },
  {
    id: "opening-b",
    title: "Content & Communities Lead",
    company: "House of Ved",
    grade: "Senior Manager",
    description: `House of Ved is a purpose-driven media house. Our goal is to provide a tangible experience of Dharma to a billion souls globally. We use Vedic wisdom to help people positively transform their inner self, relationships, careers, businesses, and beyond. We do this via social content, video content, community resources, events, cultural films, and immersive experiences. In addition to House of Ved (60-70% of time), we run Satva Partners (SP), a strategic consultancy that helps businesses achieve investment-readiness. The Content & Communities Lead will act as an in-house marketing specialist on client engagements as needed, and should expect to spend c30-40% of their time on SP.`,
    responsibilities: [
      "Act as Product Owner for all social products, including Bhagavad Gita, Hanuman Chalisa, Basics of Hinduism (new), Chants, Guided Meditations, and Puja content (new)",
      "Act as channel owner for our content across Instagram, YouTube, and Spotify",
      "Lead content strategy and campaign planning, working with Meera, Kabir, and teams to produce game-changing Dharmic content and campaigns",
      "Lead a team of 1-2 in-house apprentices; lead relationships with an ecosystem of editors, designers, music producers, and DOPs",
      "Ultimate plan owner for all socials, including content calendars and shoots",
      "Utilise in-house resources for performance tracking and reporting across all products, channels, and campaigns",
      "Act as Meera and Kabir's single point of contact for all socials and content work",
      "Build and own the product roadmap, with a horizon view of offerings across 2-3 years",
      "Co-create new products and offerings with Meera and Kabir, including defining target audience, audience need, and optimal product design",
      "Coordinate production across an ecosystem of service providers",
      "Co-create go-to-market pathways, including content, podcasts, collaborations, and PR",
      "End-to-end planning and outcomes-based delivery",
      "Utilise the team to document SOPs for all content work",
      "Incubation of Dharmic communities, both virtual and in-person",
      "Definition and launch of in-person solo events and retreats",
      "Collaborate with third parties on their events and retreats, acting as Kabir's SPOC",
      "Join Kabir in client meetings to scope their marketing needs",
      "Serve as an in-house marketing expert",
      "Create plans and coordinate delivery across multiple in-house, agency, and client stakeholders",
      "Represent the firm with professionalism and excellence"
    ],
    skills: [
      {
        category: "Marketing & Strategy",
        items: [
          "A passion for Dharma and a strong desire to protect, serve, and nourish it for present and future generations, including an active spiritual practice",
          "A seasoned professional with 5-8 years of experience across a range of marketing functions",
          "Entrepreneurial mindset, with sound business understanding, including cost-benefit analysis",
          "An obsession with social platforms, including authentic pathways to grow content",
          "Strong understanding of YouTube, including SEO and performance management",
          "Ownership mindset, taking ownership of business outcomes, not simply tasks",
          "Excellent stakeholder management skills, including juniors, peers, and seniors",
          "Excellent written and verbal communicator who inspires trust and confidence",
          "Interest in the use of AI and emerging technologies",
          "Willingness to learn and navigate ambiguity",
          "Emotional resilience, maturity, and professionalism"
        ]
      }
    ],
    experience: [
      "5-8 years of experience across a range of marketing functions",
      "Strong understanding of social platforms and YouTube performance/SEO",
      "Active spiritual practice and passion for Dharma"
    ],
    offers: [
      "Joining at the start of our growth journey – unlimited growth opportunities, including financial, experiential, and network-driven",
      "True independence and leadership in a dharmic, purpose-driven team",
      "Travel opportunities within India and overseas",
      "Direct mentorship and guidance from Kabir",
      "Competitive CTC"
    ]
  }
];
