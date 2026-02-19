import torch
from transformers import BertTokenizer, BertForMaskedLM
import random
import re

# Load pre-trained model tokenizer (vocabulary)
try:
    tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
    model = BertForMaskedLM.from_pretrained('bert-base-uncased')
    model.eval()
    print("BERT model loaded successfully.")
except Exception as e:
    print(f"Error loading BERT model: {e}")
    tokenizer = None
    model = None

def clean_text_artifacts(text):
    """
    Removes specific unicode characters that often flag AI content or look robotic.
    """
    # Replace em-dashes and en-dashes with hyphens or spaces
    text = text.replace('—', ' - ').replace('–', '-')
    # Replace smart quotes with straight quotes
    text = text.replace('“', '"').replace('”', '"').replace("‘", "'").replace("’", "'")
    # Remove zero-width spaces and other invisible characters
    text = re.sub(r'[\u200b\u200c\u200d\uFEFF]', '', text)
    return text

def prune_ai_vocabulary(text):
    """
    Mechanism 4: Vocabulary Pruning
    Identifies and masks 'Hallmark AI Words' to force BERT to replace them.
    """
    ai_words = [
        "delve", "tapestry", "pivotal", "comprehensive", "foster", 
        "underscore", "landscape", "intricate", "testament", "realm",
        "democratize", "game-changer", "unleash"
    ]
    
    # We don't mask here directly because tokenization is complex,
    # but we can return the list of words to prioritize for masking in the loop
    return ai_words

def enforce_style(text):
    """
    Mechanism 5: Explicit Style Definition
    Enforces constraints like 'No Contractions'.
    """
    # Expand contractions
    terminations = [
        (r"won't", "will not"),
        (r"can't", "cannot"),
        (r"n't", " not"),
        (r"'re", " are"),
        (r"'s", " is"), # Context dependent, but safe for 'it's' -> 'it is' usually
        (r"'d", " would"),
        (r"'ll", " will"),
        (r"'t", " not"),
        (r"'ve", " have"),
        (r"'m", " am")
    ]
    for pattern, repl in terminations:
        text = re.sub(pattern, repl, text, flags=re.IGNORECASE)
    return text

def humanize_text_bert(text, iterations=4, mask_prob=0.30):
    """
    Rewrites text using BERT Masked Language Modeling to introduce human-like variations.
    Aggressive mode: Higher mask probability and more iterations.
    """
    if not model or not tokenizer:
        return text + " [Error: Model not loaded]"

    # Pre-clean text (Sanitization)
    text = clean_text_artifacts(text)
    
    # Enforce Style (No Contractions)
    text = enforce_style(text)
    
    # Get AI words to target
    ai_words_to_prune = prune_ai_vocabulary(text)

    # Split into sentences to process manageable chunks
    sentences = re.split(r'(?<=[.!?]) +', text)
    humanized_sentences = []

    for sentence in sentences:
        if len(sentence.strip()) < 5:
            humanized_sentences.append(sentence)
            continue
            
        current_sentence = sentence
        
        for _ in range(iterations):
            inputs = tokenizer(current_sentence, return_tensors="pt")
            input_ids = inputs["input_ids"]
            labels = inputs["input_ids"].clone()

            # Create random mask
            # Randomly mask 30% of tokens (excluding CLS/SEP) for higher entropy
            seq_len = input_ids.shape[1]
            for i in range(1, seq_len - 1): # Skip CLS and SEP
                token_id = input_ids[0][i].item()
                token_word = tokenizer.decode([token_id]).strip().lower()
                
                # Check if it's a hallucinated/AI word -> Force Mask
                is_ai_word = any(w in token_word for w in ai_words_to_prune)
                
                if (random.random() < mask_prob) or is_ai_word:
                    input_ids[0][i] = tokenizer.mask_token_id

            with torch.no_grad():
                outputs = model(input_ids)
                predictions = outputs.logits

            # Decode suggestions
            for i in range(1, seq_len - 1):
                if input_ids[0][i] == tokenizer.mask_token_id:
                    # Get top 30 predictions (Maximal search space for Lexical Diversity)
                    top_k_indices = torch.topk(predictions[0, i], 30).indices.tolist()
                    
                    # Select a random word from top K to introduce variety (temperature-like)
                    # We avoid the original word if possible
                    original_token_id = labels[0][i].item()
                    
                    candidates = [idx for idx in top_k_indices if idx != original_token_id]
                    
                    if candidates:
                        selected_id = random.choice(candidates) # Pick one diverse option
                        input_ids[0][i] = selected_id
                    else:
                        input_ids[0][i] = original_token_id # Revert if no good alternative

            current_sentence = tokenizer.decode(input_ids[0], skip_special_tokens=True)
            
            # Post-processing to fix punctuation spacing often introduced by tokenizer decode
            current_sentence = re.sub(r'\s+([.,!?])', r'\1', current_sentence)
            # Fix ' s ' to 's (e.g., it ' s -> it's)
            current_sentence = current_sentence.replace(" ' s ", "'s ")
            current_sentence = current_sentence.replace(" ' t ", "'t ")

        humanized_sentences.append(current_sentence)

    return " ".join(humanized_sentences)
