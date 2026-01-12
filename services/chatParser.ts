/**
 * Chat Parser - Parses chat history from various formats
 * Supports: Cursor, Claude, ChatGPT, plain text conversations
 */

export interface ParsedMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface ParsedChatHistory {
  messages: ParsedMessage[];
  format: "cursor" | "claude" | "chatgpt" | "generic";
  metadata?: {
    totalTokens?: number;
    model?: string;
    conversationId?: string;
  };
}

/**
 * Main parser function that detects format and parses accordingly
 */
export function parseChatHistory(content: string, fileName: string): ParsedChatHistory {
  const lowerFileName = fileName.toLowerCase();
  const trimmedContent = content.trim();

  console.log(`[Parser] Detecting format for file: ${fileName}`);
  console.log(`[Parser] Content length: ${trimmedContent.length}`);
  console.log(`[Parser] First 200 chars: ${trimmedContent.substring(0, 200)}`);

  // Try JSON parsing first
  try {
    const parsed = JSON.parse(trimmedContent);
    console.log(`[Parser] Valid JSON detected`);
    if (Array.isArray(parsed)) {
      return parseJSONArray(parsed);
    }
    if (parsed.messages && Array.isArray(parsed.messages)) {
      return parseJSONObject(parsed);
    }
  } catch {
    // Not JSON, continue to text parsing
    console.log(`[Parser] Not JSON format`);
  }

  // Try to detect format
  if (lowerFileName.includes("cursor") || isLikelyCursorFormat(trimmedContent)) {
    console.log(`[Parser] Detected as Cursor format`);
    return parseCursorChat(trimmedContent);
  }

  if (lowerFileName.includes("claude") || isLikelyClaudeFormat(trimmedContent)) {
    console.log(`[Parser] Detected as Claude format`);
    return parseClaudeChat(trimmedContent);
  }

  if (lowerFileName.includes("chatgpt") || isLikelyChatGPTFormat(trimmedContent)) {
    console.log(`[Parser] Detected as ChatGPT format`);
    return parseChatGPTChat(trimmedContent);
  }

  // Fall back to generic text parsing
  console.log(`[Parser] Using generic parser`);
  return parseGenericChat(trimmedContent);
}

/**
 * Check if content looks like Cursor format
 */
function isLikelyCursorFormat(content: string): boolean {
  const hasCursorKeywords = 
    content.includes("User:") || 
    content.includes("Assistant:") ||
    content.includes("Human:") || 
    content.includes("AI:") ||
    content.includes("Cursor:") ||
    content.includes("**User**") ||
    content.includes("**Cursor**") ||
    content.includes("**Assistant**") ||
    /^#+\s*(User|Human|Assistant|AI|Cursor)/im.test(content);
  
  console.log(`[Parser] Cursor format check: ${hasCursorKeywords}`);
  return hasCursorKeywords;
}

/**
 * Check if content looks like Claude format
 */
function isLikelyClaudeFormat(content: string): boolean {
  return content.includes('"role": "user"') || 
         content.includes('"role": "assistant"') ||
         content.includes("Claude:");
}

/**
 * Check if content looks like ChatGPT format
 */
function isLikelyChatGPTFormat(content: string): boolean {
  return content.includes("ChatGPT:") || 
         content.includes('"role": "system"') ||
         content.includes("gpt-");
}

/**
 * Parse Cursor chat export format
 * Supports multiple formats: headers (# User), plain text (User:), and bold (**User**)
 */
function parseCursorChat(content: string): ParsedChatHistory {
  const messages: ParsedMessage[] = [];
  const lines = content.split("\n");
  let currentMessage: ParsedMessage | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and export metadata
    if (!trimmed || trimmed.startsWith("_Exported") || trimmed === "---") {
      continue;
    }
    
    // Check for bold markdown format (**User**, **Cursor**, etc.)
    if (/^\*\*(User|Human)\*\*$/i.test(trimmed)) {
      if (currentMessage && currentMessage.content.trim()) {
        messages.push(currentMessage);
      }
      currentMessage = {
        role: "user",
        content: "",
      };
      continue;
    }
    else if (/^\*\*(Assistant|AI|Cursor)\*\*$/i.test(trimmed)) {
      if (currentMessage && currentMessage.content.trim()) {
        messages.push(currentMessage);
      }
      currentMessage = {
        role: "assistant",
        content: "",
      };
      continue;
    }
    // Check for markdown header format (# User, ## User, # Assistant, etc.)
    else if (/^#+\s*(User|Human)/i.test(trimmed)) {
      if (currentMessage && currentMessage.content.trim()) {
        messages.push(currentMessage);
      }
      currentMessage = {
        role: "user",
        content: "",
      };
      continue;
    }
    else if (/^#+\s*(Assistant|AI|Cursor)/i.test(trimmed)) {
      if (currentMessage && currentMessage.content.trim()) {
        messages.push(currentMessage);
      }
      currentMessage = {
        role: "assistant",
        content: "",
      };
      continue;
    }
    // Check for plain text format with colon
    else if (trimmed.startsWith("User:") || trimmed.startsWith("Human:")) {
      if (currentMessage && currentMessage.content.trim()) {
        messages.push(currentMessage);
      }
      currentMessage = {
        role: "user",
        content: trimmed.replace(/^(User:|Human:)\s*/, ""),
      };
      continue;
    }
    // Check for assistant message
    else if (trimmed.startsWith("Assistant:") || trimmed.startsWith("AI:") || trimmed.startsWith("Cursor:")) {
      if (currentMessage && currentMessage.content.trim()) {
        messages.push(currentMessage);
      }
      currentMessage = {
        role: "assistant",
        content: trimmed.replace(/^(Assistant:|AI:|Cursor:)\s*/, ""),
      };
      continue;
    }
    // Continuation of current message
    else if (currentMessage) {
      if (currentMessage.content) {
        currentMessage.content += "\n" + trimmed;
      } else {
        currentMessage.content = trimmed;
      }
    }
  }

  if (currentMessage && currentMessage.content.trim()) {
    messages.push(currentMessage);
  }

  console.log(`[Cursor Parser] Extracted ${messages.length} messages`);
  if (messages.length > 0) {
    console.log(`[Cursor Parser] First message: ${messages[0].role} - ${messages[0].content.substring(0, 50)}...`);
  }

  return {
    messages,
    format: "cursor",
  };
}

/**
 * Parse Claude chat export format (usually JSON)
 */
function parseClaudeChat(content: string): ParsedChatHistory {
  try {
    const parsed = JSON.parse(content);
    
    // Claude API format
    if (Array.isArray(parsed)) {
      return {
        messages: parsed.map((msg: any) => ({
          role: msg.role === "user" ? "user" : "assistant",
          content: typeof msg.content === "string" ? msg.content : msg.content[0]?.text || "",
          timestamp: msg.timestamp,
        })),
        format: "claude",
        metadata: {
          model: "claude",
        },
      };
    }
    
    // Claude conversation export
    if (parsed.messages) {
      return parseJSONObject(parsed);
    }
  } catch {
    // Fall back to text parsing
    return parseGenericChat(content);
  }

  return parseGenericChat(content);
}

/**
 * Parse ChatGPT export format
 */
function parseChatGPTChat(content: string): ParsedChatHistory {
  try {
    const parsed = JSON.parse(content);
    
    if (Array.isArray(parsed.messages || parsed)) {
      const msgs = parsed.messages || parsed;
      return {
        messages: msgs
          .filter((msg: any) => msg.role !== "system")
          .map((msg: any) => ({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.content || "",
            timestamp: msg.timestamp,
          })),
        format: "chatgpt",
        metadata: {
          model: parsed.model || "gpt",
          conversationId: parsed.id,
        },
      };
    }
  } catch {
    // Text format with "ChatGPT:" prefix
    const messages: ParsedMessage[] = [];
    const lines = content.split("\n");
    let currentMessage: ParsedMessage | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith("You:") || trimmed.startsWith("User:")) {
        if (currentMessage) {
          messages.push(currentMessage);
        }
        currentMessage = {
          role: "user",
          content: trimmed.replace(/^(You:|User:)\s*/, ""),
        };
      } else if (trimmed.startsWith("ChatGPT:")) {
        if (currentMessage) {
          messages.push(currentMessage);
        }
        currentMessage = {
          role: "assistant",
          content: trimmed.replace(/^ChatGPT:\s*/, ""),
        };
      } else if (currentMessage && trimmed) {
        currentMessage.content += "\n" + trimmed;
      }
    }

    if (currentMessage) {
      messages.push(currentMessage);
    }

    return {
      messages,
      format: "chatgpt",
    };
  }

  return parseGenericChat(content);
}

/**
 * Parse JSON array format
 */
function parseJSONArray(parsed: any[]): ParsedChatHistory {
  return {
    messages: parsed
      .filter((msg) => msg.role === "user" || msg.role === "assistant")
      .map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
        timestamp: msg.timestamp || msg.created_at,
      })),
    format: "generic",
  };
}

/**
 * Parse JSON object format
 */
function parseJSONObject(parsed: any): ParsedChatHistory {
  return {
    messages: parsed.messages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
      timestamp: msg.timestamp || msg.created_at,
    })),
    format: "generic",
    metadata: {
      model: parsed.model,
      conversationId: parsed.id || parsed.conversation_id,
    },
  };
}

/**
 * Parse generic text format
 * Tries to identify messages by common patterns
 */
function parseGenericChat(content: string): ParsedChatHistory {
  const messages: ParsedMessage[] = [];
  const lines = content.split("\n");
  let currentMessage: ParsedMessage | null = null;

  // Common prefixes for user and assistant
  const userPrefixes = ["User:", "You:", "Human:", "Q:", "Question:", "Me:", ">"];
  const assistantPrefixes = ["Assistant:", "AI:", "Bot:", "A:", "Answer:", "Response:", "Cursor:"];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for markdown headers
    if (/^#+\s*(User|Human|You|Me)/i.test(trimmed)) {
      if (currentMessage && currentMessage.content.trim()) {
        messages.push(currentMessage);
      }
      currentMessage = {
        role: "user",
        content: "",
      };
      continue;
    }
    if (/^#+\s*(Assistant|AI|Bot|Cursor|Answer)/i.test(trimmed)) {
      if (currentMessage && currentMessage.content.trim()) {
        messages.push(currentMessage);
      }
      currentMessage = {
        role: "assistant",
        content: "",
      };
      continue;
    }

    // Check for user message
    const userPrefix = userPrefixes.find((prefix) => trimmed.startsWith(prefix));
    if (userPrefix) {
      if (currentMessage && currentMessage.content.trim()) {
        messages.push(currentMessage);
      }
      currentMessage = {
        role: "user",
        content: trimmed.replace(new RegExp(`^${userPrefix}\\s*`), ""),
      };
      continue;
    }

    // Check for assistant message
    const assistantPrefix = assistantPrefixes.find((prefix) => trimmed.startsWith(prefix));
    if (assistantPrefix) {
      if (currentMessage && currentMessage.content.trim()) {
        messages.push(currentMessage);
      }
      currentMessage = {
        role: "assistant",
        content: trimmed.replace(new RegExp(`^${assistantPrefix}\\s*`), ""),
      };
      continue;
    }

    // Continuation of current message
    if (currentMessage) {
      if (currentMessage.content) {
        currentMessage.content += "\n" + trimmed;
      } else {
        currentMessage.content = trimmed;
      }
    } else {
      // Start a new message (assume user if no prefix)
      currentMessage = {
        role: "user",
        content: trimmed,
      };
    }
  }

  if (currentMessage && currentMessage.content.trim()) {
    messages.push(currentMessage);
  }

  console.log(`[Generic Parser] Extracted ${messages.length} messages`);
  if (messages.length > 0) {
    console.log(`[Generic Parser] First message: ${messages[0].role} - ${messages[0].content.substring(0, 50)}...`);
  }

  // If we didn't find any messages, try a more aggressive approach
  if (messages.length === 0) {
    console.log(`[Generic Parser] No messages found, trying aggressive parsing...`);
    // Split by double newlines and treat each block as a message
    const blocks = content.split(/\n\s*\n/);
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i].trim();
      if (block.length > 10) { // Only include substantial blocks
        messages.push({
          role: i % 2 === 0 ? "user" : "assistant",
          content: block,
        });
      }
    }
    console.log(`[Generic Parser] Aggressive parsing found ${messages.length} messages`);
  }

  return {
    messages,
    format: "generic",
  };
}

/**
 * Extract code-related messages from parsed chat
 * Returns messages that likely discuss code changes
 */
export function extractCodeRelatedMessages(
  messages: ParsedMessage[]
): ParsedMessage[] {
  // If there are very few messages, be more lenient
  if (messages.length <= 5) {
    return messages;
  }

  const codeKeywords = [
    "code",
    "function",
    "class",
    "component",
    "file",
    "implement",
    "add",
    "create",
    "update",
    "fix",
    "bug",
    "error",
    "refactor",
    "optimize",
    "change",
    "modify",
    "delete",
    "remove",
    "feature",
    "api",
    "endpoint",
    "route",
    "database",
    "query",
    "model",
    "schema",
    "interface",
    "type",
    "import",
    "export",
    "const",
    "let",
    "var",
    "async",
    "await",
    "return",
    "how",
    "can",
    "make",
    "build",
    "app",
    "page",
    "style",
    "design",
    "layout",
    "button",
    "form",
    "data",
    "test",
    "install",
    "package",
    "npm",
    "yarn",
    "run",
    "start",
    "build",
    "deploy",
  ];

  const codeRelatedMessages = messages.filter((msg) => {
    const lowerContent = msg.content.toLowerCase();
    return codeKeywords.some((keyword) => lowerContent.includes(keyword));
  });

  // If less than 30% are code-related, return all messages (might be a code-heavy chat)
  if (codeRelatedMessages.length < messages.length * 0.3) {
    return messages;
  }

  return codeRelatedMessages;
}
