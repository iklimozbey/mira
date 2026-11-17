from typing import List
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from langchain_core.callbacks import CallbackManagerForRetrieverRun


CLINICAL_COSMETIC_CORPUS: List[Document] = [
    Document(
        page_content=(
            "Estee Lauder Double Wear Stay-in-Place Foundation: High-coverage matte liquid foundation. "
            "Contains Cyclopentasiloxane, Trimethylsiloxysilicate, and PEG/PPG-18/18 Dimethicone. "
            "Pros: 12+ hour sebum control, transfer-proof. Cons: Can oxidize 0.5 shade darker, clings to dry patches, "
            "requires oil-based double cleansing to prevent clogged pores in acne-prone skin."
        ),
        metadata={"keywords": ["double wear", "estee lauder", "matte", "foundation"], "source": "MIRA Clinical Formulation Corpus"}
    ),
    Document(
        page_content=(
            "Maybelline Fit Me Matte + Poreless Foundation: Contains Aqua, Cyclohexasiloxane, Nylon-12, Isododecane, "
            "and Alcohol Denat. Notice: Alcohol Denat is listed in the top 6 ingredients, which controls oil for oily skin "
            "but can trigger vascular flushing and barrier dryness in Rosacea (rozalı cilt) and sensitive skin types."
        ),
        metadata={"keywords": ["fit me", "maybelline", "poreless", "matte", "foundation"], "source": "MIRA INCI & Rosacea Trigger Index"}
    ),
    Document(
        page_content=(
            "Armani Luminous Silk / NARS Light Reflecting Foundation: Radiant satin finish with glycerin and lightweight "
            "emollient esters. Ideal for dry, normal, and redness-prone skin. On oily/acne-prone T-zones, wear time "
            "diminishes around hour 5 without translucent setting powder."
        ),
        metadata={"keywords": ["luminous silk", "armani", "nars", "light reflecting", "radiant", "glow"], "source": "MIRA Clinical Formulation Corpus"}
    ),
    Document(
        page_content=(
            "Glycolic Acid / AHA Peeling Serums (7% - 30%): Low molecular weight alpha-hydroxy acid that penetrates rapidly. "
            "Dermatological Caution: High risk of neurogenic inflammation, stinging, and capillary dilation in Rosacea patients. "
            "Rosacea-prone skin should substitute Glycolic Acid with Azelaic Acid (10%-15%) or PHAs (Gluconolactone)."
        ),
        metadata={"keywords": ["glycolic", "aha", "peeling", "acid", "serum", "toner"], "source": "Dermatological Rosacea Guideline DB"}
    ),
    Document(
        page_content=(
            "La Roche-Posay Anthelios / Chemical vs Mineral Sunscreens (SPF 50+): Chemical UV filters (Avobenzone, Octocrylene, "
            "Ethylhexyl Salicylate) absorb UV and convert it into heat, which may trigger thermal flushing in severe Rosacea "
            "and stinging around the eyes. Mineral Zinc Oxide / Titanium Dioxide sunscreens provide anti-inflammatory benefits for Rosacea."
        ),
        metadata={"keywords": ["spf", "sunscreen", "anthelios", "la roche", "gunes", "güneş", "uv"], "source": "Dermatological Photoprotection DB"}
    ),
    Document(
        page_content=(
            "Niacinamide 10% + Zinc 1% Serums: Effective for sebum regulation and pore appearance in acne-prone skin. "
            "However, concentrations at or above 10% frequently cause niacin flush (redness and micro-papules) on sensitive "
            "or rosacea-prone skin barriers; 2% to 5% Niacinamide is the clinically optimal golden ratio."
        ),
        metadata={"keywords": ["niacinamide", "zinc", "ordinary", "serum", "b3"], "source": "Clinical Active Ingredient DB"}
    ),
    Document(
        page_content=(
            "Centella Asiatica (Cica) / Panthenol / Madecassoside / Cicaplast Baume B5: Barrier-repairing soothing agents "
            "that downregulate inflammatory cytokines. Safe and highly recommended for Rosacea flare-ups and post-acne erythema, "
            "though rich shea butter bases (like Baume B5) should be applied thinly on oily T-zones to avoid closed comedones."
        ),
        metadata={"keywords": ["cicaplast", "cica", "centella", "panthenol", "baume", "cerave", "moisturizer", "krem"], "source": "Clinical Barrier Repair DB"}
    ),
]


class CosmeticClinicalRAGRetriever(BaseRetriever):
    """
    LangChain Custom Retriever (`BaseRetriever`) that performs keyword & semantic trait matching
    against the curated MIRA Clinical Cosmetic & Rosacea/Acne INCI Corpus.
    """

    k: int = 2

    def _get_relevant_documents(
        self, query: str, *, run_manager: CallbackManagerForRetrieverRun
    ) -> List[Document]:
        query_lower = query.lower()
        scored_docs = []

        for doc in CLINICAL_COSMETIC_CORPUS:
            keywords = doc.metadata.get("keywords", [])
            score = sum(2 for kw in keywords if kw in query_lower)
            # Also check word overlap in content
            for token in query_lower.split():
                if len(token) > 3 and token in doc.page_content.lower():
                    score += 1
            if score > 0:
                scored_docs.append((score, doc))

        scored_docs.sort(key=lambda x: x[0], reverse=True)
        if scored_docs:
            return [doc for _, doc in scored_docs[: self.k]]

        # Default fallback document if no specific brand keyword matched
        return [CLINICAL_COSMETIC_CORPUS[0]]


cosmetic_rag_retriever = CosmeticClinicalRAGRetriever()
