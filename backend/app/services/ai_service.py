"""
AI Service
Integrates with OpenAI and Anthropic Claude APIs
"""

from typing import AsyncGenerator, List, Dict, Any, Optional
from loguru import logger
import asyncio

from app.config import settings
from app.core.exceptions import AIServiceError, AIRateLimitError


class AIService:
    """
    Service for AI-powered features using OpenAI or Anthropic
    """
    
    def __init__(self, provider: Optional[str] = None):
        """
        Initialize AI service
        
        Args:
            provider: "openai" or "anthropic" (defaults to settings)
        """
        self.provider = provider or settings.AI_PROVIDER
        self._openai_client = None
        self._anthropic_client = None
    
    @property
    def openai_client(self):
        """Lazy-load OpenAI client"""
        if self._openai_client is None and settings.OPENAI_API_KEY:
            try:
                from openai import AsyncOpenAI
                self._openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            except ImportError:
                logger.error("OpenAI package not installed")
        return self._openai_client
    
    @property
    def anthropic_client(self):
        """Lazy-load Anthropic client"""
        if self._anthropic_client is None and settings.ANTHROPIC_API_KEY:
            try:
                from anthropic import AsyncAnthropic
                self._anthropic_client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            except ImportError:
                logger.error("Anthropic package not installed")
        return self._anthropic_client
    
    async def chat(
        self, 
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> str:
        """
        Send a chat message and get a response
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Creativity parameter (0-1)
            max_tokens: Maximum response tokens
            
        Returns:
            AI response text
        """
        
        if self.provider == "anthropic" and self.anthropic_client:
            return await self._chat_anthropic(messages, temperature, max_tokens)
        elif self.openai_client:
            return await self._chat_openai(messages, temperature, max_tokens)
        else:
            # Fallback to mock response
            logger.warning("No AI provider configured, using mock response")
            return self._mock_response(messages)
    
    async def chat_stream(
        self, 
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
    ) -> AsyncGenerator[str, None]:
        """
        Stream a chat response
        
        Yields:
            Chunks of the AI response
        """
        
        if self.provider == "anthropic" and self.anthropic_client:
            async for chunk in self._stream_anthropic(messages, temperature):
                yield chunk
        elif self.openai_client:
            async for chunk in self._stream_openai(messages, temperature):
                yield chunk
        else:
            # Mock streaming response
            mock = self._mock_response(messages)
            for word in mock.split():
                yield word + " "
                await asyncio.sleep(0.05)
    
    async def _chat_openai(
        self, 
        messages: List[Dict[str, str]],
        temperature: float,
        max_tokens: Optional[int],
    ) -> str:
        """
        Chat using OpenAI
        """
        
        try:
            response = await self.openai_client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens or settings.OPENAI_MAX_TOKENS,
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            error_str = str(e).lower()
            if "rate limit" in error_str:
                raise AIRateLimitError(detail=str(e), retry_after=60)
            logger.exception(f"OpenAI API error: {e}")
            raise AIServiceError(detail=str(e), provider="openai")
    
    async def _chat_anthropic(
        self, 
        messages: List[Dict[str, str]],
        temperature: float,
        max_tokens: Optional[int],
    ) -> str:
        """
        Chat using Anthropic Claude
        """
        
        try:
            # Convert messages format for Anthropic
            system_msg = None
            claude_messages = []
            
            for msg in messages:
                if msg["role"] == "system":
                    system_msg = msg["content"]
                else:
                    claude_messages.append({
                        "role": msg["role"],
                        "content": msg["content"],
                    })
            
            response = await self.anthropic_client.messages.create(
                model=settings.ANTHROPIC_MODEL,
                max_tokens=max_tokens or settings.ANTHROPIC_MAX_TOKENS,
                system=system_msg or "You are a helpful data analyst assistant.",
                messages=claude_messages,
                temperature=temperature,
            )
            
            return response.content[0].text
            
        except Exception as e:
            error_str = str(e).lower()
            if "rate limit" in error_str:
                raise AIRateLimitError(detail=str(e), retry_after=60)
            logger.exception(f"Anthropic API error: {e}")
            raise AIServiceError(detail=str(e), provider="anthropic")
    
    async def _stream_openai(
        self, 
        messages: List[Dict[str, str]],
        temperature: float,
    ) -> AsyncGenerator[str, None]:
        """
        Stream response from OpenAI
        """
        
        try:
            stream = await self.openai_client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                temperature=temperature,
                max_tokens=settings.OPENAI_MAX_TOKENS,
                stream=True,
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            logger.exception(f"OpenAI streaming error: {e}")
            raise AIServiceError(detail=str(e), provider="openai")
    
    async def _stream_anthropic(
        self, 
        messages: List[Dict[str, str]],
        temperature: float,
    ) -> AsyncGenerator[str, None]:
        """
        Stream response from Anthropic
        """
        
        try:
            # Convert messages format
            system_msg = None
            claude_messages = []
            
            for msg in messages:
                if msg["role"] == "system":
                    system_msg = msg["content"]
                else:
                    claude_messages.append({
                        "role": msg["role"],
                        "content": msg["content"],
                    })
            
            async with self.anthropic_client.messages.stream(
                model=settings.ANTHROPIC_MODEL,
                max_tokens=settings.ANTHROPIC_MAX_TOKENS,
                system=system_msg or "You are a helpful data analyst assistant.",
                messages=claude_messages,
                temperature=temperature,
            ) as stream:
                async for text in stream.text_stream:
                    yield text
                    
        except Exception as e:
            logger.exception(f"Anthropic streaming error: {e}")
            raise AIServiceError(detail=str(e), provider="anthropic")
    
    def _mock_response(self, messages: List[Dict[str, str]]) -> str:
        """
        Generate a mock response when no AI provider is configured
        """
        
        user_message = ""
        for msg in reversed(messages):
            if msg["role"] == "user":
                user_message = msg["content"].lower()
                break
        
        # Generate contextual mock responses
        if "trend" in user_message:
            return (
                "Based on the data analysis, **revenue shows a consistent upward trend** "
                "with an average monthly growth of 15.3%.\n\n"
                "• Q2 shows the strongest performance\n"
                "• June is typically the peak month\n"
                "• Year-over-year growth is 23.5%"
            )
        elif "anomal" in user_message or "outlier" in user_message:
            return (
                "I detected **several anomalies** in your data:\n\n"
                "• March 15th shows a 340% spike in order volume\n"
                "• This correlates with the Spring promotional campaign\n"
                "• 2.3% of transactions are statistical outliers"
            )
        elif "recommend" in user_message or "suggest" in user_message:
            return (
                "Based on the analysis, here are my **recommendations**:\n\n"
                "• Focus marketing efforts on the Electronics category (+42% growth)\n"
                "• Increase inventory for the East region (highest performer)\n"
                "• Consider price optimization for the $20-50 range (best conversion)"
            )
        elif "correlation" in user_message:
            return (
                "I found **strong correlations** in your data:\n\n"
                "• Price and Quantity: -0.73 (negative correlation)\n"
                "• Marketing Spend and Revenue: 0.89 (strong positive)\n"
                "• Customer Age and Order Value: 0.45 (moderate positive)"
            )
        else:
            return (
                "Based on my analysis of your data:\n\n"
                "**Key Findings:**\n"
                "• Total revenue: $48,200 (+23.5% vs previous period)\n"
                "• Top category: Electronics (35% of revenue)\n"
                "• Best performing region: East ($15,200)\n\n"
                "Would you like me to dive deeper into any specific area?"
            )
    
    async def analyze_data(
        self, 
        data_summary: str,
        question: Optional[str] = None,
    ) -> str:
        """
        Analyze data and generate insights
        
        Args:
            data_summary: Text summary of the data
            question: Specific question to answer
            
        Returns:
            Analysis text
        """
        
        prompt = f"""Analyze this data and provide insights:

{data_summary}

{f"Specifically answer: {question}" if question else "Provide key insights and recommendations."}

Format your response with:
- Clear bullet points
- Specific numbers and percentages
- Actionable recommendations"""

        return await self.chat([
            {"role": "system", "content": "You are an expert data analyst. Provide clear, actionable insights."},
            {"role": "user", "content": prompt},
        ])
    
    async def explain_chart(
        self, 
        chart_config: Dict[str, Any],
        data_context: str,
    ) -> str:
        """
        Generate an explanation for a chart
        
        Args:
            chart_config: Chart configuration
            data_context: Context about the data
            
        Returns:
            Explanation text
        """
        
        prompt = f"""Explain this chart in simple terms:

Chart Type: {chart_config.get('type', 'unknown')}
Title: {chart_config.get('title', 'Untitled')}

Data Context:
{data_context}

Provide:
1. What the chart shows
2. Key takeaways
3. Any notable patterns or insights"""

        return await self.chat([
            {"role": "system", "content": "You are a data visualization expert. Explain charts clearly for non-technical users."},
            {"role": "user", "content": prompt},
        ])