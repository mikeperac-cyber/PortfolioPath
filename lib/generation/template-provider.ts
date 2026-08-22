import type {
  GeneratedResult,
  GenerationContext,
  GenerationProvider,
  InterviewPreparation,
  PersonalStatementConnection,
  PortfolioText,
  PresentationDraft,
  ProjectBlueprint,
  ProjectIdea,
  ProgressSummary,
  RecommendationEvidence,
  ReflectionSupport,
} from "./types"

function wrap<T>(data: T, context: GenerationContext, warnings: string[] = []): GeneratedResult<T> {
  return {
    data,
    provenance: {
      sourceRecordIds: context.sourceRecordIds,
      guidanceLabel: "Editable guidance generated from approved PortfolioPath records or a planned project brief.",
      warnings,
      requiresFactualConfirmation: true,
    },
  }
}

function text(input: Record<string, unknown>, key: string, fallback: string) {
  const value = input[key]
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function list(input: Record<string, unknown>, key: string) {
  return Array.isArray(input[key]) ? input[key].filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : []
}

export class TemplateGenerationProvider implements GenerationProvider {
  async projectIdeas(input: Record<string, unknown>, context: GenerationContext) {
    const major = text(input, "intendedMajor", "your intended field")
    const hours = Math.max(1, Math.min(8, Number(input.weeklyHours) || 3))
    const ideas: ProjectIdea[] = [
      {
        title: "Document a local observation study",
        category: "Research",
        description: "Choose one observable local question, keep a dated field log, and publish a concise findings brief.",
        fit: `Connects genuine interests with ${major} through a feasible evidence trail.`,
        majorConnection: `Uses research habits relevant to ${major}.`,
        durationWeeks: 6,
        weeklyHours: hours,
        estimatedCostTry: 250,
        finalDeliverable: "Illustrated findings brief",
        expectedEvidence: ["dated field notes", "method draft", "source list", "final brief"],
        targetSkills: ["Research", "Writing", "Data analysis"],
        measurableOutcomes: ["Complete four observation sessions", "Cite at least five reliable sources", "Produce one reviewed final brief"],
        risks: ["Insufficient observations", "Scope becomes too broad"],
        ethicalNotes: ["Separate observation from conclusion", "Do not invent participants or impact"],
        suggestionOnly: true,
      },
      {
        title: "Build a useful bilingual digital guide",
        category: "Coding and technology",
        description: "Create and test a small website that explains a local topic to an international audience.",
        fit: `Combines student ownership with a practical ${major} connection.`,
        majorConnection: `Shows planning, iteration, communication, and digital literacy relevant to ${major}.`,
        durationWeeks: 8,
        weeklyHours: hours,
        estimatedCostTry: 500,
        finalDeliverable: "Deployed bilingual website",
        expectedEvidence: ["repository commits", "wireframes", "test notes", "deployment link"],
        targetSkills: ["Coding", "Organization", "Communication"],
        measurableOutcomes: ["Build four accessible pages", "Document three user tests", "Publish a change log"],
        risks: ["Technical scope expands", "User testers unavailable"],
        ethicalNotes: ["Do not claim partnerships without confirmation", "Use licensed media"],
        suggestionOnly: true,
      },
      {
        title: "Create an evidence-backed community resource",
        category: "Social impact",
        description: "Identify a narrow information need, consult appropriate sources, and produce a factual resource.",
        fit: `Turns a real concern into a manageable project related to ${major}.`,
        majorConnection: `Demonstrates applied communication and responsible problem-solving for ${major}.`,
        durationWeeks: 7,
        weeklyHours: hours,
        estimatedCostTry: 300,
        finalDeliverable: "Bilingual resource pack",
        expectedEvidence: ["research notes", "consent records", "draft revisions", "distribution log"],
        targetSkills: ["Initiative", "Communication", "Resilience"],
        measurableOutcomes: ["Consult three consented sources", "Complete two revision rounds", "Publish one factual resource"],
        risks: ["Access to sources", "Privacy concerns"],
        ethicalNotes: ["Get consent for quotations", "Report reach without exaggeration"],
        suggestionOnly: true,
      },
    ]
    return wrap(ideas, context, ["These are suggestions, not completed achievements."])
  }

  async projectBlueprint(input: Record<string, unknown>, context: GenerationContext) {
    const title = text(input, "title", "This project")
    const objective = text(input, "objective", "complete one realistic, documented objective")
    const hours = Math.max(1, Math.min(10, Number(input.weeklyHours) || 3))
    const milestones = list(input, "milestones")
    const weeklyRoadmap = (milestones.length ? milestones : ["Define the scope", "Complete the first documented action", "Review and adapt", "Prepare the final deliverable"]).map((milestone, index) => ({
      week: index + 1,
      milestone,
      tasks: [`Plan the smallest feasible action for ${milestone.toLowerCase()}.`, "Complete the work yourself and record the date.", "Save one private evidence item with an explanation."],
      estimatedHours: hours,
      evidence: ["Dated note, file, image, or link that directly supports this week’s work"],
      reflectionPrompt: "What did I complete, what changed, and what evidence supports that account?",
      obstacle: "The planned action may take more time or access than expected.",
      alternativeAction: "Reduce the scope and document the adaptation rather than claiming the original plan was completed.",
    }))
    const data: ProjectBlueprint = {
      summary: `${title} is a planned student-owned project. Its purpose is to ${objective}.`,
      primaryObjective: objective,
      secondaryObjectives: ["Keep a dated record of work", "Collect evidence as work happens", "Reflect on one decision or adaptation each week"],
      successCriteria: ["The final deliverable exists", "Each completed claim has linked evidence", "The student confirms factual accuracy before sharing"],
      weeklyRoadmap,
      evidencePlan: ["Collect original notes, files, images, links, or consented feedback.", "Explain what each item demonstrates in the student’s own words.", "Keep sensitive people, locations, and information private unless permission is documented."],
      skillPlan: ["Start each chosen skill as a target.", "Move it to evidence-supported only when an item is linked.", "A counselor or mentor may confirm only a specific, factual observation."],
      risks: [
        { risk: "Scope grows beyond available time", mitigation: "Choose a smaller final deliverable and document the decision." },
        { risk: "Evidence is collected too late", mitigation: "Attach one record immediately after each meaningful action." },
      ],
      firstSevenActions: ["Choose the project title", "Write the personal motivation", "Set three planned outcomes", "Create the first weekly milestone", "Schedule the first task", "Prepare a private evidence folder", "Write the first reflection prompt in your own words"],
    }
    return wrap(data, context, ["Roadmap tasks are plans. They are not recorded achievements."])
  }

  async reflectionSupport(input: Record<string, unknown>, context: GenerationContext) {
    const reflection = text(input, "reflection", "")
    const vagueTerms = ["a lot", "very", "successful", "helped many", "changed everything", "great impact"].filter((term) => reflection.toLowerCase().includes(term))
    const data: ReflectionSupport = {
      questions: ["What did you personally do, and on what date?", "What decision did you make when the plan changed?", "Which evidence could another person view to understand your progress?"],
      vagueLanguageFlags: vagueTerms,
      requestsForEvidence: ["Name one file, note, photo, link, or dated record that supports your account."],
      structureSuggestions: ["Action: what happened.", "Decision: what you changed or chose.", "Learning: what you understand differently now.", "Next step: the smallest realistic action."],
      studentOwnershipNotice: "Use these questions to improve your own reflection. PortfolioPath does not write a fictional reflection for you.",
    }
    return wrap(data, context, vagueTerms.length ? ["Replace vague impact language with concrete, supportable detail."] : [])
  }

  async portfolioText(input: Record<string, unknown>, context: GenerationContext) {
    const title = text(input, "title", "This project")
    const objective = text(input, "objective", "a documented student objective")
    const actions = list(input, "completedActions")
    const outcomes = list(input, "outcomes")
    const skills = list(input, "confirmedSkills")
    const sourceSummary = actions.length ? actions.join("; ") : "No completed actions are selected yet."
    const data: PortfolioText = {
      projectSummary: `${title} is an editable portfolio draft based only on selected records. Its objective was to ${objective}.`,
      process: `Selected completed actions: ${sourceSummary}`,
      challenges: text(input, "challenge", "Add a student-authored challenge and adaptation supported by a reflection before publishing."),
      outcomes: outcomes.length ? `Documented outcomes: ${outcomes.join("; ")}` : "No evidence-supported outcomes are selected yet.",
      skills: skills.length ? `Counselor-confirmed skills: ${skills.join(", ")}.` : "No counselor-confirmed skills are selected yet.",
      intendedMajorConnection: text(input, "majorConnection", "Explain this connection in the student’s own words using the project process, not a claim of admissions value."),
      futureDevelopment: "Describe one realistic next step. Keep future development separate from completed work.",
    }
    return wrap(data, context, ["This is a draft. Remove any sentence that is not supported by the selected records."])
  }

  async presentation(input: Record<string, unknown>, context: GenerationContext) {
    const title = text(input, "title", "My project")
    const objective = text(input, "objective", "complete a documented objective")
    const data: PresentationDraft = {
      pitch30: `I created ${title} to ${objective}. I documented my decisions, evidence, and what changed along the way.`,
      explanation90: `${title} began with a genuine question. My objective was to ${objective}. I planned weekly work, kept evidence, reflected on challenges, and revised the project when the evidence required it.`,
      presentation3m: `Introduce the motivation for ${title}, explain the objective, describe verified actions in sequence, show selected evidence, discuss one challenge and adaptation, then close with what you learned and what you would do next.`,
      interviewQuestions: ["Why did you choose this project?", "What changed from your original plan?", "Which evidence best represents your contribution?", "What was your most difficult decision?", "How did you demonstrate sustained commitment?", "How does this connect to your intellectual curiosity?"],
      answerNotes: ["Use one concrete example per answer.", "Distinguish plans from completed work.", "Name uncertainty rather than exaggerating impact."],
    }
    return wrap(data, context)
  }

  async recommendationEvidence(input: Record<string, unknown>, context: GenerationContext) {
    const data: RecommendationEvidence = {
      warning: "This document provides evidence for a recommender. It is not a recommendation letter and must not contain invented observations. Focus on verifiable impact and initiative relevant for US college applications.",
      context: text(input, "context", "Project context is drawn from verified PortfolioPath records."),
      completedActions: list(input, "completedActions"),
      initiativeEvidence: list(input, "initiativeEvidence"),
      reliabilityEvidence: list(input, "reliabilityEvidence"),
      problemSolvingEvidence: list(input, "problemSolvingEvidence"),
      resilienceEvidence: list(input, "resilienceEvidence"),
      communicationEvidence: list(input, "communicationEvidence"),
      confirmedSkills: list(input, "confirmedSkills"),
      outcomes: list(input, "outcomes"),
    }
    return wrap(data, context, ["Only reviewed evidence and counselor-confirmed skills are included."])
  }

  async personalStatementConnection(input: Record<string, unknown>, context: GenerationContext) {
    const data: PersonalStatementConnection = {
      possibleThemes: ["A decision that changed your approach", "A challenge that required adaptation", "A question that connects to your intended area of study"],
      sourceBackedMoments: list(input, "sourceMoments"),
      reflectionQuestions: ["What did this project reveal about how you learn?", "Which specific moment would be meaningful even without an impressive outcome?", "How does the project connect to a future question rather than a guaranteed career result?"],
      caution: "This is a theme inventory, not a finished personal statement. Use only moments you can explain truthfully.",
    }
    return wrap(data, context)
  }

  async interviewPreparation(input: Record<string, unknown>, context: GenerationContext) {
    const data: InterviewPreparation = {
      questions: ["What was your personal role?", "Which evidence best demonstrates your process?", "What did you do when your initial plan did not work?", "What would you improve with more time?", "How does this connect to your intended field?"],
      answerPlanningNotes: ["Start with a concrete action.", "Name a decision and its reason.", "Refer to one source record without overstating its meaning."],
      challengingFollowUps: ["What did you choose not to do, and why?", "How do you know the outcome was supported?", "What would someone who disagrees with your conclusion say?"],
      evidenceChecklist: list(input, "sourceRecords").length ? list(input, "sourceRecords") : ["Select a dated task, evidence item, and reflection before practising."],
    }
    return wrap(data, context)
  }

  async progressSummary(input: Record<string, unknown>, context: GenerationContext) {
    const data: ProgressSummary = {
      period: text(input, "period", "Current project period"),
      completed: list(input, "completed"),
      evidenceReviewed: list(input, "evidenceReviewed"),
      reflections: list(input, "reflections"),
      counselorConfirmedSkills: list(input, "confirmedSkills"),
      concerns: list(input, "concerns"),
      nextSteps: list(input, "nextSteps"),
    }
    return wrap(data, context)
  }
}
