import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

def get_llm(temperature: float = 0.7):
    #Factory function to get the LLM based on environment variables.

    # 1. FAU HPC (OwlChat) - Default
    hpc_key = os.getenv("HPC_API_KEY")
    if hpc_key:
        return ChatOpenAI(
            model=os.getenv("HPC_MODEL_NAME", "gpt-oss-120b"),
            openai_api_key=hpc_key,
            openai_api_base="https://hub.nhr.fau.de/api/llmgw/v1",
            temperature=temperature
        )

    # 2. DeepSeek
    ds_key = os.getenv("DS_API_KEY")
    if ds_key:
        return ChatOpenAI(
            model="deepseek-chat",
            openai_api_key=ds_key,
            openai_api_base="https://api.deepseek.com",
            temperature=temperature
        )

    # 3. OpenAI
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        return ChatOpenAI(
            model="gpt-4o",
            openai_api_key=openai_key,
            temperature=temperature
        )

    # 4. Google Gemini
    gemini_key = os.getenv("GOOGLE_API_KEY")
    if gemini_key:
        return ChatGoogleGenerativeAI(
            model="gemini-1.5-pro",
            google_api_key=gemini_key,
            temperature=temperature
        )

    # 5. GROQ
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        return ChatOpenAI(
            model="llama-3.3-70b-versatile",
            openai_api_key=groq_key,
            openai_api_base="https://api.groq.com/openai/v1",
            temperature=temperature
        )

    # Fallback or Error
    raise ValueError("No LLM API key found. Please set DS_API_KEY, OPENAI_API_KEY, or GOOGLE_API_KEY in your .env file.")

# Example of how to add a new provider:
# def get_custom_llm():
#     return ChatOpenAI(
#         model="custom-model",
#         openai_api_key=os.getenv("CUSTOM_API_KEY"),
#         openai_api_base="https://custom-api-base.com"
#     )
