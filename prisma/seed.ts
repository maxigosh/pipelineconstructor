import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Create demo user with fixed UUID
  const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001"
  const user = await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {},
    create: {
      id: DEMO_USER_ID,
      email: "demo@pipeline.dev",
      name: "Demo User",
    },
  })

  console.log("Created demo user:", user.email)

  // Create template pipelines
  const templates = [
    {
      name: "Content Pipeline",
      description: "Generate polished content from a simple idea: idea → structure → draft → edit → final",
      tags: ["content", "writing", "marketing"],
      steps: [
        {
          name: "Ideation",
          order: 0,
          system_prompt: "You are a creative content strategist.",
          user_prompt: "Generate 5 unique angles for content about: {{input}}. For each angle, provide a title and a one-sentence hook.",
          provider: "openai" as const,
          model: "gpt-4o-mini",
        },
        {
          name: "Structure",
          order: 1,
          system_prompt: "You are an expert content architect.",
          user_prompt: "Based on these content ideas:\n{{step_1_output}}\n\nChoose the best angle and create a detailed outline with sections, key points, and target word count.",
          provider: "openai" as const,
          model: "gpt-4o",
        },
        {
          name: "Draft",
          order: 2,
          system_prompt: "You are a skilled copywriter. Write engaging, clear, and well-structured content.",
          user_prompt: "Write a complete first draft based on this outline:\n{{step_2_output}}\n\nMake it engaging and informative. Target audience: professionals.",
          provider: "openai" as const,
          model: "gpt-4o",
        },
        {
          name: "Edit",
          order: 3,
          system_prompt: "You are a professional editor. Focus on clarity, flow, grammar, and engagement.",
          user_prompt: "Edit and improve this draft:\n{{step_3_output}}\n\nFix any issues, improve transitions, strengthen the opening and closing. Mark your changes.",
          provider: "anthropic" as const,
          model: "claude-sonnet-4-6",
        },
        {
          name: "Final Polish",
          order: 4,
          system_prompt: "You are a senior content editor doing final quality review.",
          user_prompt: "Do a final polish of this content:\n{{step_4_output}}\n\nEnsure it's publication-ready. Add a compelling meta description and 5 SEO-friendly tags.",
          provider: "anthropic" as const,
          model: "claude-sonnet-4-6",
        },
      ],
    },
    {
      name: "Research Pipeline",
      description: "Deep research on any topic: question → decompose → research → synthesize → report",
      tags: ["research", "analysis", "report"],
      steps: [
        {
          name: "Question Analysis",
          order: 0,
          system_prompt: "You are a research methodologist.",
          user_prompt: "Analyze this research question: {{input}}\n\nBreak it down into:\n1. Core question\n2. Sub-questions (3-5)\n3. Key terms to research\n4. Expected findings categories",
          provider: "openai" as const,
          model: "gpt-4o",
        },
        {
          name: "Decomposition",
          order: 1,
          system_prompt: "You are a research planner.",
          user_prompt: "Based on this analysis:\n{{step_1_output}}\n\nCreate a research plan with specific queries and sources to investigate for each sub-question.",
          provider: "openai" as const,
          model: "gpt-4o",
        },
        {
          name: "Research",
          order: 2,
          system_prompt: "You are an expert researcher with broad knowledge. Provide detailed, factual information.",
          user_prompt: "Following this research plan:\n{{step_2_output}}\n\nProvide comprehensive findings for each area. Include data points, expert opinions, and relevant examples.",
          provider: "openai" as const,
          model: "gpt-4o",
        },
        {
          name: "Synthesis",
          order: 3,
          system_prompt: "You are an analytical thinker who excels at synthesizing information.",
          user_prompt: "Synthesize these research findings:\n{{step_3_output}}\n\nIdentify patterns, contradictions, key insights, and areas needing further investigation.",
          provider: "anthropic" as const,
          model: "claude-sonnet-4-6",
        },
        {
          name: "Report",
          order: 4,
          system_prompt: "You are a professional report writer.",
          user_prompt: "Create a structured research report based on:\n\nOriginal question: {{input}}\nSynthesis: {{step_4_output}}\n\nFormat: Executive Summary, Key Findings, Detailed Analysis, Conclusions, Recommendations.",
          provider: "anthropic" as const,
          model: "claude-sonnet-4-6",
        },
      ],
    },
    {
      name: "Code Review Pipeline",
      description: "Comprehensive code review: code → bug analysis → optimization → documentation",
      tags: ["code", "review", "engineering"],
      steps: [
        {
          name: "Bug Analysis",
          order: 0,
          system_prompt: "You are a senior software engineer specializing in bug detection and security analysis.",
          user_prompt: "Analyze this code for bugs, security vulnerabilities, and potential issues:\n\n{{input}}\n\nList each issue with: severity (critical/high/medium/low), description, line reference, and fix suggestion.",
          provider: "anthropic" as const,
          model: "claude-sonnet-4-6",
        },
        {
          name: "Optimization",
          order: 1,
          system_prompt: "You are a performance optimization expert.",
          user_prompt: "Review this code for optimization opportunities:\n\n{{input}}\n\nBug report:\n{{step_1_output}}\n\nSuggest performance improvements, better algorithms, and cleaner patterns. Provide optimized code snippets.",
          provider: "anthropic" as const,
          model: "claude-sonnet-4-6",
        },
        {
          name: "Refactoring",
          order: 2,
          system_prompt: "You are a clean code advocate and refactoring expert.",
          user_prompt: "Provide the refactored version of this code incorporating the fixes and optimizations:\n\nOriginal code:\n{{input}}\n\nBug fixes needed:\n{{step_1_output}}\n\nOptimizations:\n{{step_2_output}}\n\nProvide the complete refactored code with explanations for each change.",
          provider: "openai" as const,
          model: "gpt-4o",
        },
        {
          name: "Documentation",
          order: 3,
          system_prompt: "You are a technical documentation specialist.",
          user_prompt: "Generate comprehensive documentation for the refactored code:\n{{step_3_output}}\n\nInclude: function/class descriptions, parameter docs, return values, usage examples, and inline comments for complex logic.",
          provider: "openai" as const,
          model: "gpt-4o",
        },
      ],
    },
    {
      name: "Startup Validation",
      description: "Validate a startup idea: idea → JTBD → competitors → MVP → landing page",
      tags: ["startup", "validation", "business"],
      steps: [
        {
          name: "Idea Analysis",
          order: 0,
          system_prompt: "You are a startup advisor with experience in venture capital and product-market fit.",
          user_prompt: "Analyze this startup idea: {{input}}\n\nProvide:\n1. Problem statement\n2. Target audience\n3. Value proposition\n4. Revenue model hypotheses\n5. Initial risk assessment",
          provider: "openai" as const,
          model: "gpt-4o",
        },
        {
          name: "Jobs To Be Done",
          order: 1,
          system_prompt: "You are a JTBD (Jobs To Be Done) framework expert.",
          user_prompt: "Based on this startup analysis:\n{{step_1_output}}\n\nCreate a JTBD analysis:\n1. Functional jobs (3-5)\n2. Emotional jobs (3-5)\n3. Social jobs (2-3)\n4. Pain points for each job\n5. Current solutions and their gaps",
          provider: "anthropic" as const,
          model: "claude-sonnet-4-6",
        },
        {
          name: "Competitive Analysis",
          order: 2,
          system_prompt: "You are a competitive intelligence analyst.",
          user_prompt: "Based on:\nStartup idea: {{input}}\nJTBD Analysis: {{step_2_output}}\n\nProvide competitive analysis:\n1. Direct competitors (3-5) with strengths/weaknesses\n2. Indirect competitors\n3. Competitive advantages of our idea\n4. Market positioning map\n5. Differentiation strategy",
          provider: "openai" as const,
          model: "gpt-4o",
        },
        {
          name: "MVP Definition",
          order: 3,
          system_prompt: "You are a product manager experienced in lean startup methodology.",
          user_prompt: "Based on:\nIdea: {{input}}\nJTBD: {{step_2_output}}\nCompetitors: {{step_3_output}}\n\nDefine the MVP:\n1. Core features (must-have, 3-5)\n2. Nice-to-have features (for v2)\n3. User stories\n4. Technical stack recommendation\n5. Development timeline estimate\n6. Success metrics",
          provider: "anthropic" as const,
          model: "claude-sonnet-4-6",
        },
        {
          name: "Landing Page",
          order: 4,
          system_prompt: "You are a conversion copywriter and landing page expert.",
          user_prompt: "Create landing page copy for this startup:\nIdea: {{input}}\nValue Prop: {{step_1_output}}\nMVP: {{step_4_output}}\n\nProvide:\n1. Hero section (headline, subheadline, CTA)\n2. Problem section\n3. Solution section with features\n4. Social proof section (suggested testimonial styles)\n5. FAQ (5 questions)\n6. Final CTA section",
          provider: "openai" as const,
          model: "gpt-4o",
        },
      ],
    },
    {
      name: "Translation Pipeline",
      description: "Professional translation workflow: text → translate → adapt → verify",
      tags: ["translation", "localization", "language"],
      steps: [
        {
          name: "Translation",
          order: 0,
          system_prompt: "You are a professional translator. Provide accurate, natural translations.",
          user_prompt: "Translate the following text to English (if not English) or to Russian (if English):\n\n{{input}}\n\nMaintain the original tone, style, and formatting.",
          provider: "openai" as const,
          model: "gpt-4o",
        },
        {
          name: "Cultural Adaptation",
          order: 1,
          system_prompt: "You are a localization expert who understands cultural nuances.",
          user_prompt: "Review this translation for cultural adaptation:\n\n{{step_1_output}}\n\nOriginal: {{input}}\n\n1. Identify culturally-specific references that need adaptation\n2. Suggest localized alternatives\n3. Check idiomatic expressions\n4. Provide the adapted version",
          provider: "anthropic" as const,
          model: "claude-sonnet-4-6",
        },
        {
          name: "Quality Check",
          order: 2,
          system_prompt: "You are a bilingual proofreader and quality assurance specialist.",
          user_prompt: "Perform quality check on this translation:\n\nOriginal: {{input}}\nTranslation: {{step_1_output}}\nAdapted: {{step_2_output}}\n\nCheck for:\n1. Accuracy (meaning preservation)\n2. Fluency (natural language)\n3. Terminology consistency\n4. Grammar and spelling\n5. Formatting preservation\n\nProvide corrected final version.",
          provider: "openai" as const,
          model: "gpt-4o",
        },
        {
          name: "Final Review",
          order: 3,
          system_prompt: "You are a senior translation reviewer.",
          user_prompt: "Final review of translation quality:\n\nOriginal: {{input}}\nFinal translation: {{step_3_output}}\n\nProvide:\n1. Quality score (1-10)\n2. Any remaining issues\n3. The final polished translation\n4. Brief translation notes for the client",
          provider: "anthropic" as const,
          model: "claude-sonnet-4-6",
        },
      ],
    },
  ]

  for (const template of templates) {
    const existing = await prisma.pipeline.findFirst({
      where: { name: template.name, is_template: true },
    })
    if (existing) {
      console.log(`Template "${template.name}" already exists, skipping`)
      continue
    }

    const pipeline = await prisma.pipeline.create({
      data: {
        user_id: user.id,
        name: template.name,
        description: template.description,
        is_public: true,
        is_template: true,
        tags: template.tags,
        steps: {
          create: template.steps.map((step) => ({
            ...step,
            config: { temperature: 0.7, max_tokens: 4096 },
            input_mapping: { mode: "full_response" },
            output_mapping: { mode: "full_response" },
          })),
        },
      },
    })
    console.log(`Created template: ${pipeline.name}`)
  }

  console.log("Seed complete!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
