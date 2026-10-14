"use client";

import "./glossary.css";

const TERMS = [
  {
    term: "Anarchism",
    definition:
      "The advocacy and enforcement of individual sovereignty at the expense of authoritarianism. Etymologically, 'anarchy' means 'without a ruler' (not chaos). Where authoritarianism is the monopolization of aggression, anarchism is its abolition. An anarchist is a scientist, not a sociopath.",
  },
  {
    term: "Authoritarianism",
    definition:
      "The advocacy and enforcement of obedience to a ruler at the expense of individual sovereignty. Any form of collectivism (socialism, communism, totalitarianism, etc.) is an interpolation of authoritarianism. Ruling is the business of taxing; taxing is stealing by another name. It is the antithesis of natural philosophy.",
  },
  {
    term: "Cash",
    definition:
      "A form of monetary token or legal tender that possesses purchasing power rather than intrinsic value. The thing credit stands in for during a deferral.",
  },
  {
    term: "Coincidences of wants",
    definition:
      "The unlikelihood that two people each have what the other wants. The orthodox diagnosis of the primordial impediment to trade: the improbability of two people having disposable possessions that coincide with what the other desires to possess.",
  },
  {
    term: "Confirmation bias",
    definition:
      "The will to confirm personal bias, which competes with fidelity to the scientific method. It is normal insofar as it cannot be eliminated, but it must be acknowledged and accommodated. When it isn't, intellectual dishonesty arises, and pseudoscience ensues.\n\nA normal and ineliminable tendency; intellectual dishonesty and pseudoscience arise when it is not acknowledged and accommodated. Pseudoscience is used to confirm a bias, especially authoritarian ones.",
  },
  {
    term: "Credit",
    definition:
      "Credit is permission that is conferred as a placeholder for payment. When quantized, individual units of permission are most aptly called 'credits.' Credit is the obligation instantiated whenever settlement is deferred; it exists from the moment a trade is consummated until it is settled.\n\nIt is something given in lieu of payment — like regal trophies, blue ribbons, smiley stickers, and letter grades, which confer accreditation, not payment. Everyday examples include the interval between ordering a hotdog and handing over cash, or paying a remote seller and awaiting delivery.",
  },
  {
    term: "Currency",
    definition:
      "A specific product, service, or monetary token whose worth is used as a unit-of-measure in the algorithm called money. Anything can be used as a currency ad hoc; neither party need know what the other is using as currency. It is an arbitrary magnitude of commercial value used as a denominator/divisor.",
  },
  {
    term: "Dogma",
    definition:
      "The irrational rhetoric of a ruling doctrine. Used to conceal the shift from a bank's promise to a bank's permission, and to turn purchasing power into social-credit scores.",
  },
  {
    term: "Emergent phenomenon",
    definition:
      "The systemic-like coordination that arises by the widespread practice of barter in a system-of-merit. There is no central planner; coordination emerges from autonomous actors trading ad hoc.",
  },
  {
    term: "Free-will",
    definition:
      "What is encountered when we try to explain human nature. The autonomous capacity of living, especially human, agents that makes explaining human nature vastly more complicated than explaining other living things. Our will is informed by self-awareness, which is why sociology cannot attain the predictive rigor of the hard sciences.",
  },
  {
    term: "Information technology",
    definition:
      "The technological means of encoding, reifying, and communicating information, including tokenization. It must comport with the logical imperatives of the rules of representation. Advances in it change the modality of encoding and thus the fidelity of what is represented.",
  },
  {
    term: "Law",
    definition:
      "A principle discovered in Nature, not decreed by humans. It comes from God, Gaia, or Nature, depending on your worldview. Law is synonymous with principle, which is a paradigm in Nature — a natural pattern that exists independently and is uncovered rather than invented.\n\nDistinct from a rule or statute issued by a ruler. The 'rule of law' properly understood is adherence to principle, not obedience to a principal.",
  },
  {
    term: "Lawful",
    definition:
      "Discovered by reason or natural philosophy, not decreed. A lawful definition is a paradigm in Nature.",
  },
  {
    term: "Legal",
    definition:
      "Decreed by a principal or ruler. A legal definition is an edict or statute. 'Legal' and 'lawful' should never be used interchangeably.",
  },
  {
    term: "Measurement problem",
    definition:
      "An individual's challenge to assess the relative worth of what they buy and sell. The primordial impediment to trade; the heterodox diagnosis of the problem that money actually solves. Predates bartering; money is the cognition and arithmetic process by which we equilibrate personal preferences.",
  },
  {
    term: "Medium of exchange",
    definition:
      "A cryptic, strategically ambiguous dictionary phrase used as monetary subterfuge. It does not usefully explain payment and conceals the shift in modalities from metal to paper to digits while preserving a system of permission.",
  },
  {
    term: "Merit",
    definition:
      "The tangible benefit that is derived from possessing, consuming, or using a given product or service. The impetus to trade, not a metric for measuring worth. In a system-of-merit, products and services are traded directly according to each party's subjective perception of merit.",
  },
  {
    term: "Money",
    definition:
      "A method of measuring the relative worth of a product or service. Mathematically: the algorithm 'if a is equal to b, and b is equal to c, then c is equal to a,' where the variables are quantities of specific products or services and b is used as the unit of measure (currency). It is a principle we deduce, a form of logic and cognition, not a form of payment or token.",
  },
  {
    term: "Morality",
    definition:
      "Rooted in the principle that voluntary trade is moral and involuntary trade (theft, including taxation) is immoral. The non-aggression principle is a natural law. The question of morality reduces to whether its definition comes from a principal or a principle.",
  },
  {
    term: "Opportunity cost",
    definition:
      "A notion that economists convolute to obfuscate the crucial concept of intersubjective agreement and the recalibration of relative worth.",
  },
  {
    term: "Ownership",
    definition:
      "Having the prerogative to possess, use, and dispose of property without having to get permission from anyone. Only an owner has the prerogative to decide something's worth. Private property is fundamental to voluntary trade and repugnant to authoritarianism.",
  },
  {
    term: "Permission",
    definition:
      "What is conferred by a token-of-credit or system-of-credit. A token-of-credit is a permission-slip; only with it may one participate in the monopolized economy. Quantized units of permission are credits.",
  },
  {
    term: "Prerogative",
    definition:
      "The sovereign right of an owner to decide worth, to possess, use, and dispose of property. Contrasted with permission. A system based on prerogatives is anarchist and merit-based; a system based on permission is authoritarian and credit-based.",
  },
  {
    term: "Protocol",
    definition:
      "A software protocol that encapsulates and communicates the metadata of a trade (what is traded, the ratio, when, where, with whom) as an affidavit or deed of ownership. All that is required to barter once literacy and computers exist.",
  },
  {
    term: "Purchasing power",
    definition:
      "The worth of a monetary token expressed as a quantity or amount of a product or service it will buy. Differs from commercial value in its specificity to monetary tokens. Conceived by monetarists to account for the eroding worth of fiat tokens; used to hide the nature of a permission system.",
  },
  {
    term: "Rationality",
    definition:
      "The epistemological disposition that relies on principles, not intelligence, expertise, or education. Contrasted with religiosity. Based on logic and first principles; the foundation of a system-of-merit and a deduced definition of money.",
  },
  {
    term: "Religiosity",
    definition:
      "The epistemological disposition that relies on principals, not spirituality, the afterlife, or the existence of God. Used by rulers to indoctrinate belief in the necessity of their tokens, credits, and tribute. Requires the subordination of rationality.",
  },
  {
    term: "Rule",
    definition:
      "A decree issued by a ruler, a principal. Distinct from a law, which is a principle. Rulers call their edicts 'statutes' and define a statute as a law to equate the legitimacy of a rule with a law.",
  },
  {
    term: "Semantic precision",
    definition:
      "The requirement that terms have a single, unambiguous meaning and be logically consistent with every other term in a definition. Essential for scientific inquiry and for properly defining money, morality, and law.",
  },
  {
    term: "Sovereignty",
    definition:
      "Individual sovereignty: the condition anarchism advocates and authoritarianism sacrifices. The essence of ownership and of the prerogative to decide worth without permission.\n\nA predilection for individual sovereignty isn't a bad bias — unless you are in the business of ruling, or suffering Stockholm Syndrome.",
  },
  {
    term: "System-of-credit",
    definition:
      "A system of commerce that collectivizes and socializes credit and succeeds when its brand of credit is prerequisite to all trade in a territory, forming a monopoly. Facilitates control and plunder; relies on religiosity. Tokens represent permission, not value.\n\nOstensibly exists to facilitate commerce; in reality exists to control a population.",
  },
  {
    term: "System-of-merit",
    definition:
      "The antithesis of a monopoly. Based on autonomous actors free to trade anything for anything ad hoc through barter. Relies on the rationality of every individual. No central planner, no quantized credit, no intermediary token-of-credit. Coordination is emergent.",
  },
  {
    term: "Theory of value",
    definition:
      "A theory economists have long sought and utterly failed to find. They have been looking for a new means of determining any thing's price, when they should have been looking for an explanation of how we have done so since time immemorial.",
  },
  {
    term: "Title",
    definition:
      "A token that is further reified (tokenized) into a nonfungible contract that deeds ownership. Substantiates a claim of ownership to specific property. More elucidatingly called a 'deed.'",
  },
  {
    term: "Token",
    definition:
      "Semantically, a token is a tokenized icon. Colloquially, a token is an artifact that confers something immaterial by imbuing it with physical constraints so it can be displaced and relinquished. In orthodox economics, a token is any medium that is exchanged. Used to augment memory and to reify agreements. Efficacy is judged by fidelity to what it represents.",
  },
  {
    term: "Token-of-credit",
    definition:
      "A permission-slip. A monetary token that quantizes permission; its magnitude of purchasing power is proportional to how many a principal permits to exist. Cannot itself be the value it is purported to represent. The basis of a monopolized system-of-credit.",
  },
  {
    term: "Tokenization",
    definition:
      "A metaphysical means of reifying a concept, notion, sentiment, or emotion. We tokenize to give material form to things that don't materially exist, but are nonetheless real. Doing so provides for immaterial things to be conferred.\n\nTokenization is the process that turns an abstract unit of permission (credit) into a tangible or representable token. The tokens representing credit may be made of wood, metal, paper, or be wholly hypothetical — the material form is largely irrelevant to the system's overt function, but profoundly relevant to its covert function.",
  },
  {
    term: "Usury",
    definition:
      "A historically sinful practice whereby permission or credit cannot be bought but can only be borrowed.",
  },
];

export default function Glossary() {
  return (
    <div className="flex flex-col h-full bg-page text-text-primary">
      <div className="flex-1 overflow-y-auto">
        <div className="glossary max-w-3xl mx-auto px-6 py-10">
          <h1>Glossary</h1>
          <dl>
            {TERMS.map((entry) => (
              <div key={entry.term} className="glossary-entry">
                <dt>{entry.term}</dt>
                <dd className="whitespace-pre-line">{entry.definition}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
