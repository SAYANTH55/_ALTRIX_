import sys
import os

# Add ai-humanizer to path
sys.path.append(os.path.join(os.getcwd(), 'ai-humanizer'))

try:
    print("Importing humanizer...")
    from humanizer import humanize_text_bert
    
    text = "Artificial Intelligence is transforming the world rapidly."
    print(f"Original: {text}")
    
    # This might take time on first run to download model
    result = humanize_text_bert(text)
    print(f"Humanized: {result}")
    
    if "Error" in result:
        print("FAILED")
        sys.exit(1)
    else:
        print("SUCCESS")
        
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"Execution Error: {e}")
    sys.exit(1)
