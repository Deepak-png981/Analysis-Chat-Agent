from .code_generation_prompts import code_generation_system_prompt
from .clarification_prompts import clarification_system_prompt

class PromptFactory:
    def __init__(self):
        self.prompts = {
            "code_generation_system": code_generation_system_prompt,
            "clarification_system": clarification_system_prompt,
        }

    def get_prompt(self, name: str) -> str:
        prompt = self.prompts.get(name)
        if not prompt:
            raise ValueError(f"Prompt '{name}' not found.")
        return prompt

# Singleton instance
prompt_factory = PromptFactory() 