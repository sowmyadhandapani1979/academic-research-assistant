import type { Paper } from "../types";
import {
  matchesDiscipline,
  matchesYear,
  parseDiscipline,
  resolveYearRange,
} from "../lib/searchFilters.js";

export const EXAMPLE_QUERIES = ["quantum computing", "climate change"];

export const DEFAULT_RECENTS = [
  "Deep Learning",
  "Renewable Energy",
  "Immunotherapy",
];

export const papers: Paper[] = [
  {
    id: "attention",
    title: "Attention Is All You Need",
    authorsShort: "Vaswani et al.",
    authorsFull: "Vaswani, A., Shazeer, N., Parmar, N., et al. (2017)",
    year: 2017,
    fieldsOfStudy: ["Computer Science"],
    abstract:
      "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks in an encoder-decoder configuration. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
    sections: [
      {
        heading: "1. Introduction",
        paragraphs: [
          "Recurrent neural networks, long short-term memory and gated recurrent neural networks in particular, have been firmly established as state of the art approaches in sequence modeling and transduction problems such as language modeling and machine translation.",
          "However, fundamental constraints in how recurrent models are built, which process inputs sequentially, make parallelization difficult...",
        ],
      },
      {
        heading: "2. Background",
        paragraphs: [
          "The goal of reducing sequential computation also forms the foundation of the Extended Neural GPU, MemNets and a few other models have used attention mechanism as part of their architecture...",
        ],
      },
    ],
    tagsPalette: {
      "deep-learning": "blue",
      nlp: "blue",
      transformers: "blue",
      architecture: "purple",
    },
    related: [
      { id: "bert", blurb: "2018 · Same tag" },
      { id: "gpt2", blurb: "2019 · Deep Learning" },
    ],
    summary:
      "This seminal paper introduces the Transformer architecture, replacing recurrent neural networks with self-attention mechanisms. The key innovations include: (1) Parallel processing capability eliminating sequential bottlenecks, (2) Multi-head attention for capturing diverse dependencies, and (3) Scalability to larger datasets. The architecture has become foundational for modern NLP and has been adapted across domains.",
    takeaways:
      "Self-attention > RNNs for parallelization; Multi-head attention for semantic richness; Foundation for BERT, GPT, and modern transformers",
    readTime: "12 min",
    url: "https://arxiv.org/abs/1706.03762",
    source: "arXiv",
  },
  {
    id: "bert",
    title: "BERT: Pre-training of Deep Bidirectional Transformers",
    authorsShort: "Devlin et al.",
    authorsFull: "Devlin, J., Chang, M., Lee, K., Toutanova, K. (2018)",
    year: 2018,
    fieldsOfStudy: ["Computer Science"],
    abstract:
      "We introduce BERT, a new method of pre-training language representations from unlabeled text by jointly conditioning on both left and right context in all layers.",
    sections: [
      {
        heading: "1. Introduction",
        paragraphs: [
          "Language model pre-training has been shown to be effective for improving many natural language processing tasks. BERT extends this idea with bidirectional context, allowing the model to fuse left and right representations at every layer.",
        ],
      },
    ],
    tagsPalette: { "language-models": "purple", nlp: "purple" },
    related: [
      { id: "attention", blurb: "2017 · Transformers" },
      { id: "gpt2", blurb: "2019 · Language models" },
    ],
    summary:
      "BERT pre-trains deep bidirectional representations from unlabeled text, then fine-tunes with just one additional output layer. Masked language modeling and next-sentence prediction enable strong results on sentence-level and token-level tasks.",
    takeaways:
      "Bidirectional context; masked LM; one extra layer for fine-tuning",
    readTime: "10 min",
    url: "https://arxiv.org/abs/1810.04805",
    source: "arXiv",
  },
  {
    id: "gpt2",
    title: "GPT-2: Language Models are Unsupervised Multitask Learners",
    authorsShort: "Radford et al.",
    authorsFull: "Radford, A., Wu, J., Child, R., et al. (2019)",
    year: 2019,
    fieldsOfStudy: ["Computer Science"],
    abstract:
      "We demonstrate that language models begin learning these tasks without explicit supervision, when trained on a new dataset of internet text assembled for this work.",
    sections: [
      {
        heading: "1. Introduction",
        paragraphs: [
          "When trained on a large enough dataset, GPT-2 shows that language models can perform a wide range of tasks in a zero-shot setting, without task-specific training data.",
        ],
      },
    ],
    tagsPalette: { "generative-models": "orange" },
    related: [
      { id: "attention", blurb: "2017 · Architecture" },
      { id: "bert", blurb: "2018 · Pre-training" },
    ],
    summary:
      "GPT-2 shows that sufficiently large unsupervised language models can perform downstream tasks without explicit supervision, by framing them as language modeling.",
    takeaways: "Scale + data; zero-shot transfer; decoder-only transformers",
    readTime: "9 min",
    url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf",
    source: "OpenAI",
  },
];

export function paperById(id: string) {
  return papers.find((p) => p.id === id);
}

export function searchPapers(
  query: string,
  opts?: { discipline?: string; period?: string; from?: string; to?: string },
) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const discipline = parseDiscipline(opts?.discipline);
  const range = resolveYearRange(opts);
  return papers.filter((p) => {
    const hay = `${p.title} ${p.authorsShort} ${p.abstract} transformers machine learning language models`.toLowerCase();
    if (!q.split(/\s+/).some((token) => hay.includes(token))) return false;
    if (!matchesYear(p.year, range)) return false;
    if (!matchesDiscipline(p, discipline)) return false;
    return true;
  });
}
