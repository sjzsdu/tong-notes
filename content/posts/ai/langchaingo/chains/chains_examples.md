---
title: "LangChainGo Chains 详细示例指南"
date: 2025-07-24T10:00:00+08:00
author: "AI助手"
description: "深入展示LangChainGo chains包的各种链类型使用方法和最佳实践"
tags: ["LangChainGo", "Go", "架构分析", "Chains", "示例"]
categories: ["ai", "langchaingo", "chains"]
draft: false
---

# LangChainGo Chains 详细示例指南

本文档通过详细的示例展示了 LangChainGo `chains` 包的各种链类型和使用方法。每个示例都包含完整的代码、详细说明和使用场景。

## 📋 目录

1. [环境准备和基础设置](#环境准备)
2. [基础链示例](#基础链示例)
3. [顺序链示例](#顺序链示例)
4. [文档处理链示例](#文档处理链示例)
5. [特定任务链示例](#特定任务链示例)
6. [内存管理示例](#内存管理示例)
7. [并行处理示例](#并行处理示例)
8. [辅助函数](#辅助函数)

---

## 环境准备

首先准备必要的依赖和基础设置：

### 依赖导入

```go
package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/tmc/langchaingo/callbacks"
	"github.com/tmc/langchaingo/chains"
	"github.com/tmc/langchaingo/documentloaders"
	"github.com/tmc/langchaingo/embeddings"
	"github.com/tmc/langchaingo/llms"
	"github.com/tmc/langchaingo/llms/openai"
	"github.com/tmc/langchaingo/memory"
	"github.com/tmc/langchaingo/outputparser"
	"github.com/tmc/langchaingo/prompts"
	"github.com/tmc/langchaingo/schema"
	"github.com/tmc/langchaingo/textsplitter"
	"github.com/tmc/langchaingo/tools"
	"github.com/tmc/langchaingo/vectorstores/chroma"

	_ "github.com/mattn/go-sqlite3"
)
```

### 基础设置

```go
func main() {
	// 设置OpenAI API密钥
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		log.Fatal("OPENAI_API_KEY环境变量未设置")
	}

	// 创建上下文
	ctx := context.Background()

	// 创建回调处理器，用于记录链的执行过程
	callbackHandler := callbacks.NewManager()
	callbackHandler.AddHandler(callbacks.NewLogHandler())

	// 创建LLM模型
	llm, err := openai.New(
		openai.WithModel("gpt-3.5-turbo"),
		openai.WithCallbacksHandler(callbackHandler),
	)
	if err != nil {
		log.Fatalf("创建LLM失败: %v", err)
	}

	// 运行各种示例
	basicChainExample(ctx, llm)
	sequentialChainExample(ctx, llm)
	documentChainsExample(ctx, llm)
	specificTaskChainsExample(ctx, llm)
	memoryManagementExample(ctx, llm)
	parallelProcessingExample(ctx, llm)
}
```

---

## 基础链示例

基础链是最简单的链类型，包括 `LLMChain` 和 `Transform` 链。

### 1.1 LLMChain - 基础语言模型链

**功能说明**：`LLMChain` 是最基础的链类型，直接将提示词模板与 LLM 结合使用。

**使用场景**：
- 简单的问答
- 文本生成
- 模板化回复

```go
func basicChainExample(ctx context.Context, llm llms.Model) {
	fmt.Println("\n=== 基础链示例 ===")

	// 创建提示词模板
	promptTemplate := prompts.NewPromptTemplate(
		"你是一个有用的AI助手。请回答以下问题: {question}",
		[]string{"question"},
	)

	// 创建LLMChain
	llmChain := chains.NewLLMChain(llm, promptTemplate)
	
	// 执行链
	result, err := chains.Run(ctx, llmChain, "什么是LangChain?")
	if err != nil {
		log.Fatalf("执行LLMChain失败: %v", err)
	}
	fmt.Printf("LLMChain结果: %s\n", result)
```

### 1.2 Transform 链 - 数据转换链

**功能说明**：`Transform` 链用于执行任意的数据转换逻辑，不涉及 LLM 调用。

**使用场景**：
- 数据预处理
- 格式转换
- 简单的业务逻辑处理

```go
	// Transform链示例
	transformChain := chains.NewTransform(
		// 转换函数：将输入文本转换为大写
		func(ctx context.Context, input map[string]any) (map[string]any, error) {
			text, ok := input["text"].(string)
			if !ok {
				return nil, fmt.Errorf("输入必须包含'text'字段")
			}
			return map[string]any{"result": strings.ToUpper(text)}, nil
		},
		[]string{"text"},    // 输入键
		[]string{"result"},  // 输出键
	)

	transformResult, err := chains.Run(ctx, transformChain, "hello world")
	if err != nil {
		log.Fatalf("执行Transform链失败: %v", err)
	}
	fmt.Printf("Transform链结果: %s\n", transformResult)
}
```

---

## 顺序链示例

顺序链允许将多个链按顺序连接，前一个链的输出作为后一个链的输入。

### 2.1 SimpleSequentialChain - 简单顺序链

**功能说明**：每个子链只有一个输入和一个输出，数据按顺序传递。

**使用场景**：
- 多步骤文本处理
- 复杂任务分解
- 流水线处理

```go
func sequentialChainExample(ctx context.Context, llm llms.Model) {
	fmt.Println("\n=== 顺序链示例 ===")

	// 第一个链：生成故事大纲
	outlinePrompt := prompts.NewPromptTemplate(
		"请为一个关于{topic}的短故事创建一个简短的大纲。",
		[]string{"topic"},
	)
	outlineChain := chains.NewLLMChain(llm, outlinePrompt)

	// 第二个链：根据大纲生成故事
	storyPrompt := prompts.NewPromptTemplate(
		"根据以下大纲创建一个短故事：\n{input}\n请确保故事有一个好的开头、中间和结尾。",
		[]string{"input"},
	)
	storyChain := chains.NewLLMChain(llm, storyPrompt)

	// 创建SimpleSequentialChain
	simpleSeqChain := chains.NewSimpleSequentialChain([]chains.Chain{outlineChain, storyChain})
	
	// 执行链
	simpleSeqResult, err := chains.Run(ctx, simpleSeqChain, "太空探险")
	if err != nil {
		log.Fatalf("执行SimpleSequentialChain失败: %v", err)
	}
	fmt.Printf("SimpleSequentialChain结果: \n%s\n", simpleSeqResult)
```

### 2.2 SequentialChain - 复杂顺序链

**功能说明**：支持多个输入和输出键，可以更灵活地控制数据流向。

**使用场景**：
- 需要保持多个变量状态的复杂处理
- 多分支数据流
- 复杂的业务逻辑实现

```go
	// 第一个链：生成人物描述
	characterPrompt := prompts.NewPromptTemplate(
		"创建一个名为{character_name}的角色描述，他/她生活在{setting}。",
		[]string{"character_name", "setting"},
	)
	characterChain := chains.NewLLMChain(llm, characterPrompt)

	// 第二个链：生成情节
	plotPrompt := prompts.NewPromptTemplate(
		"为以下角色创建一个情节：\n{character_description}\n情节应该发生在{setting}并包含{theme}元素。",
		[]string{"character_description", "setting", "theme"},
	)
	plotChain := chains.NewLLMChain(llm, plotPrompt)

	// 创建SequentialChain
	seqChain, err := chains.NewSequentialChain(
		[]chains.Chain{characterChain, plotChain},
		[]string{"character_name", "setting", "theme"}, // 输入键
		[]string{"text"},                               // 输出键
		map[string]string{                              // 变量映射
			"character_chain.text": "character_description",
		},
	)
	if err != nil {
		log.Fatalf("创建SequentialChain失败: %v", err)
	}

	// 执行链
	seqResult, err := chains.Call(ctx, seqChain, map[string]any{
		"character_name": "李明",
		"setting":        "未来的北京",
		"theme":          "人工智能",
	})
	if err != nil {
		log.Fatalf("执行SequentialChain失败: %v", err)
	}
	fmt.Printf("SequentialChain结果: \n%s\n", seqResult["text"])
}
```

---

## 文档处理链示例

文档处理链专门用于处理多个文档的场景，提供不同的处理策略。

### 准备示例文档

```go
func documentChainsExample(ctx context.Context, llm llms.Model) {
	fmt.Println("\n=== 文档处理链示例 ===")

	// 准备示例文档
	docs := []schema.Document{
		{PageContent: "LangChain是一个用于开发由语言模型驱动的应用程序的框架。它可以帮助开发人员使用语言模型构建端到端的应用程序。"},
		{PageContent: "LangChain提供了多种组件，如提示模板、LLM封装、链、代理等，使开发人员能够轻松地将这些组件组合在一起。"},
		{PageContent: "LangChain支持多种语言，包括Python和Go。LangChainGo是LangChain的Go语言实现。"},
		{PageContent: "LangChain的核心概念包括链（Chain）、代理（Agent）、内存（Memory）等。这些概念使得开发人员可以构建复杂的语言处理流程。"},
	}
```

### 3.1 StuffDocuments - 文档合并处理

**功能说明**：将所有文档合并后一次性发送给 LLM 处理。

**使用场景**：
- 文档数量少且总长度不超过模型限制
- 需要全局分析的场景
- 简单的文档问答

**优点**：简单直接，保持完整上下文
**缺点**：受模型token限制，不适合大量文档

```go
	// 创建提示词模板
	stuffPrompt := prompts.NewPromptTemplate(
		"根据以下文档回答问题：\n{documents}\n\n问题: {question}\n回答:",
		[]string{"documents", "question"},
	)
	
	// 创建StuffDocuments链
	stuffChain := chains.NewStuffDocuments(chains.NewLLMChain(llm, stuffPrompt))
	
	// 执行链
	stuffResult, err := chains.Call(ctx, stuffChain, map[string]any{
		"input_documents": docs,
		"question":        "LangChain的核心概念是什么？",
	})
	if err != nil {
		log.Fatalf("执行StuffDocuments失败: %v", err)
	}
	fmt.Printf("StuffDocuments结果: \n%s\n", stuffResult["text"])
```

### 3.2 RefineDocuments - 迭代优化处理

**功能说明**：逐个处理文档，每次都基于前一次的结果进行优化。

**使用场景**：
- 需要逐步完善答案的场景
- 文档数量多但每个文档都很重要
- 迭代式分析任务

**优点**：可以处理大量文档，逐步完善结果
**缺点**：处理时间较长，可能丢失早期文档信息

```go
	// 初始提示词
	initialPrompt := prompts.NewPromptTemplate(
		"根据以下文档回答问题：\n{document}\n\n问题: {question}\n回答:",
		[]string{"document", "question"},
	)
	
	// 优化提示词
	refinePrompt := prompts.NewPromptTemplate(
		"根据以下新文档完善你的答案。\n\n原始答案: {existing_answer}\n新文档: {document}\n\n问题: {question}\n更新后的答案:",
		[]string{"existing_answer", "document", "question"},
	)
	
	// 创建RefineDocuments链
	refineChain := chains.NewRefineDocuments(
		chains.NewLLMChain(llm, initialPrompt),
		chains.NewLLMChain(llm, refinePrompt),
	)
	
	// 执行链
	refineResult, err := chains.Call(ctx, refineChain, map[string]any{
		"input_documents": docs,
		"question":        "LangChain支持哪些语言？",
	})
	if err != nil {
		log.Fatalf("执行RefineDocuments失败: %v", err)
	}
	fmt.Printf("RefineDocuments结果: \n%s\n", refineResult["text"])
```

### 3.3 MapReduceDocuments - 并行处理后归并

**功能说明**：先并行处理每个文档（Map），然后合并所有结果（Reduce）。

**使用场景**：
- 大量文档需要快速处理
- 可以并行化的分析任务
- 需要提取和汇总信息的场景

**优点**：可并行处理，效率高，适合大规模文档
**缺点**：实现较复杂，可能丢失文档间关联

```go
	// Map阶段：提取关键信息
	mapPrompt := prompts.NewPromptTemplate(
		"根据以下文档提取关键信息：\n{document}\n\n关键信息:",
		[]string{"document"},
	)
	
	// Reduce阶段：综合分析
	reducePrompt := prompts.NewPromptTemplate(
		"根据以下提取的关键信息，综合回答问题：\n{documents}\n\n问题: {question}\n回答:",
		[]string{"documents", "question"},
	)
	
	// 创建Map和Reduce链
	mapChain := chains.NewLLMChain(llm, mapPrompt)
	reduceChain := chains.NewStuffDocuments(chains.NewLLMChain(llm, reducePrompt))

	// 创建MapReduceDocuments链
	mapReduceChain := chains.NewMapReduceDocuments(mapChain, reduceChain)
	
	// 执行链
	mapReduceResult, err := chains.Call(ctx, mapReduceChain, map[string]any{
		"input_documents": docs,
		"question":        "简要概括LangChain是什么？",
	})
	if err != nil {
		log.Fatalf("执行MapReduceDocuments失败: %v", err)
	}
	fmt.Printf("MapReduceDocuments结果: \n%s\n", mapReduceResult["text"])
}
```

---

## 特定任务链示例

这些链专门为特定的应用场景而设计，提供开箱即用的功能。
### 4.1 LLMMathChain - 数学计算链

**功能说明**：专门用于解析和计算数学表达式的链。

**使用场景**：
- 自然语言数学问题求解
- 计算器功能
- 数学表达式解析

```go
func specificTaskChainsExample(ctx context.Context, llm llms.Model) {
	fmt.Println("\n=== 特定任务链示例 ===")

	// 创建数学计算链
	mathChain := chains.NewLLMMathChain(llm)
	
	// 执行数学计算
	mathResult, err := chains.Run(ctx, mathChain, "如果我有5个苹果，每个苹果重150克，总重量是多少千克？")
	if err != nil {
		log.Fatalf("执行LLMMathChain失败: %v", err)
	}
	fmt.Printf("LLMMathChain结果: %s\n", mathResult)
```

### 4.2 RetrievalQA - 检索问答链

**功能说明**：结合向量检索和问答功能，基于知识库回答问题。

**使用场景**：
- 知识库问答
- 文档搜索和问答
- RAG（检索增强生成）应用

```go
	// 创建嵌入模型
	embedder, err := openai.NewEmbedder()
	if err != nil {
		log.Printf("创建嵌入模型失败: %v，跳过RetrievalQA示例", err)
		return
	}

	// 创建向量存储
	vectorStore, err := createVectorStore(ctx, embedder, docs)
	if err != nil {
		log.Printf("创建向量存储失败: %v，跳过RetrievalQA示例", err)
		return
	}

	// 创建RetrievalQA链
	retrievalQA, err := chains.NewRetrievalQAFromLLM(llm, vectorStore.AsRetriever())
	if err != nil {
		log.Fatalf("创建RetrievalQA失败: %v", err)
	}

	// 执行检索问答
	qaResult, err := chains.Run(ctx, retrievalQA, "LangChain的主要组件有哪些？")
	if err != nil {
		log.Fatalf("执行RetrievalQA失败: %v", err)
	}
	fmt.Printf("RetrievalQA结果: %s\n", qaResult)
```

### 4.3 ConversationalRetrievalQA - 对话式检索问答

**功能说明**：带有对话历史的检索问答，支持上下文相关的问答。

**使用场景**：
- 智能客服系统
- 多轮对话问答
- 上下文相关的知识查询

```go
	// 创建对话内存
	mem := memory.NewConversationBuffer()
	
	// 创建对话式检索问答链
	convQA, err := chains.NewConversationalRetrievalQAFromLLM(
		llm,
		vectorStore.AsRetriever(),
		chains.WithConversationalRetrievalQAMemory(mem),
	)
	if err != nil {
		log.Fatalf("创建ConversationalRetrievalQA失败: %v", err)
	}

	// 第一个问题
	convResult1, err := chains.Run(ctx, convQA, "LangChain是什么？")
	if err != nil {
		log.Fatalf("执行ConversationalRetrievalQA失败: %v", err)
	}
	fmt.Printf("对话QA结果1: %s\n", convResult1)

	// 第二个问题（引用上下文）
	convResult2, err := chains.Run(ctx, convQA, "它支持哪些语言？")
	if err != nil {
		log.Fatalf("执行ConversationalRetrievalQA失败: %v", err)
	}
	fmt.Printf("对话QA结果2: %s\n", convResult2)
```

### 4.4 SQLDatabaseChain - SQL数据库查询链

**功能说明**：将自然语言转换为SQL查询并执行。

**使用场景**：
- 自然语言数据库查询
- 商业智能问答
- 数据分析助手

```go
	// 创建示例SQLite数据库
	db, err := createSampleDatabase()
	if err != nil {
		log.Printf("创建示例数据库失败: %v，跳过SQLDatabaseChain示例", err)
		return
	}
	defer db.Close()

	// 创建SQLDatabaseChain
	sqlChain, err := chains.NewSQLDatabaseChain(llm, db, "users")
	if err != nil {
		log.Fatalf("创建SQLDatabaseChain失败: %v", err)
	}

	// 执行自然语言SQL查询
	sqlResult, err := chains.Run(ctx, sqlChain, "有多少用户年龄超过30岁？")
	if err != nil {
		log.Fatalf("执行SQLDatabaseChain失败: %v", err)
	}
	fmt.Printf("SQLDatabaseChain结果: %s\n", sqlResult)
```

### 4.5 APIChain - API调用链

**功能说明**：根据API规范生成API调用代码。

**使用场景**：
- API文档助手
- 自动化API测试
- API使用示例生成

```go
	// 定义API规范
	apiSpec := `
	API名称: 天气API
	描述: 获取指定城市的天气信息
	基础URL: https://api.example.com/weather
	参数:
	  - city: 城市名称（必填）
	  - units: 温度单位，可选值为celsius或fahrenheit（可选，默认celsius）
	返回格式: JSON
	示例响应:
	{
	  "city": "北京",
	  "temperature": 25,
	  "conditions": "晴天",
	  "humidity": 40
	}
	`

	// 创建APIChain
	apiChain, err := chains.NewAPIChain(llm, apiSpec, true)
	if err != nil {
		log.Fatalf("创建APIChain失败: %v", err)
	}

	// 生成API调用代码
	apiResult, err := chains.Run(ctx, apiChain, "获取北京的天气信息")
	if err != nil {
		log.Fatalf("执行APIChain失败: %v", err)
	}
	fmt.Printf("APIChain结果: %s\n", apiResult)
}
```

---

## 内存管理示例

内存管理允许链保持对话历史和上下文状态。

### 5.1 ConversationBuffer - 对话缓冲内存

**功能说明**：保存完整的对话历史记录。

**使用场景**：
- 聊天机器人
- 对话系统
- 上下文相关的任务处理

```go
func memoryManagementExample(ctx context.Context, llm llms.Model) {
	fmt.Println("\n=== 内存管理示例 ===")

	// 创建对话内存
	mem := memory.NewConversationBuffer()

	// 创建带有内存的LLMChain
	promptTemplate := prompts.NewPromptTemplate(
		"当前对话历史:\n{chat_history}\n人类: {human_input}\nAI:",
		[]string{"chat_history", "human_input"},
	)

	conversationChain := chains.NewLLMChain(
		llm,
		promptTemplate,
		chains.WithMemory(mem),
	)

	// 第一轮对话
	result1, err := chains.Call(ctx, conversationChain, map[string]any{
		"human_input": "你好，我叫小明。",
	})
	if err != nil {
		log.Fatalf("执行对话失败: %v", err)
	}
	fmt.Printf("对话1 - 人类: 你好，我叫小明。\n")
	fmt.Printf("对话1 - AI: %s\n", result1["text"])

	// 第二轮对话（引用上下文）
	result2, err := chains.Call(ctx, conversationChain, map[string]any{
		"human_input": "你还记得我的名字吗？",
	})
	if err != nil {
		log.Fatalf("执行对话失败: %v", err)
	}
	fmt.Printf("对话2 - 人类: 你还记得我的名字吗？\n")
	fmt.Printf("对话2 - AI: %s\n", result2["text"])

	// 清除内存
	err = mem.Clear(ctx)
	if err != nil {
		log.Fatalf("清除内存失败: %v", err)
	}
	fmt.Println("✨ 内存已清除")

	// 第三轮对话（内存已清除）
	result3, err := chains.Call(ctx, conversationChain, map[string]any{
		"human_input": "你还记得我的名字吗？",
	})
	if err != nil {
		log.Fatalf("执行对话失败: %v", err)
	}
	fmt.Printf("对话3 - 人类: 你还记得我的名字吗？\n")
	fmt.Printf("对话3 - AI: %s\n", result3["text"])
}
```

---

## 并行处理示例

并行处理可以提高处理多个任务的效率。

### 6.1 Apply函数 - 批量并行执行

**功能说明**：对多个输入并行执行同一个链。

**使用场景**：
- 批量数据处理
- 大规模内容生成
- 并发任务执行

```go
func parallelProcessingExample(ctx context.Context, llm llms.Model) {
	fmt.Println("\n=== 并行处理示例 ===")

	// 创建一个简单的LLMChain
	promptTemplate := prompts.NewPromptTemplate(
		"生成一个关于{topic}的简短描述，不超过50个字。",
		[]string{"topic"},
	)

	llmChain := chains.NewLLMChain(llm, promptTemplate)

	// 准备多个输入
	inputs := []map[string]any{
		{"topic": "人工智能"},
		{"topic": "区块链"},
		{"topic": "量子计算"},
		{"topic": "虚拟现实"},
	}

	// 并行执行链（最多2个并发worker）
	results, err := chains.Apply(ctx, llmChain, inputs, 2)
	if err != nil {
		log.Fatalf("并行执行链失败: %v", err)
	}

	// 打印结果
	fmt.Println("📊 并行处理结果:")
	for i, result := range results {
		fmt.Printf("🔸 主题: %s\n", inputs[i]["topic"])
		fmt.Printf("   描述: %s\n\n", result["text"])
	}
}
```

---

## 辅助函数

以下是支持上述示例的辅助函数：
### 创建向量存储

用于支持 RetrievalQA 相关示例：

```go
func createVectorStore(ctx context.Context, embedder embeddings.Embedder, docs []schema.Document) (*chroma.Store, error) {
	// 创建临时Chroma存储
	vectorStore, err := chroma.New(
		ctx,
		chroma.WithEmbedder(embedder),
		chroma.WithInMemoryDB(),
	)
	if err != nil {
		return nil, fmt.Errorf("创建向量存储失败: %w", err)
	}

	// 添加文档到向量存储
	_, err = vectorStore.AddDocuments(ctx, docs)
	if err != nil {
		return nil, fmt.Errorf("添加文档到向量存储失败: %w", err)
	}

	return vectorStore, nil
}
```

### 创建示例数据库

用于支持 SQLDatabaseChain 示例：

```go
func createSampleDatabase() (*sql.DB, error) {
	// 创建内存数据库
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		return nil, fmt.Errorf("打开数据库失败: %w", err)
	}

	// 创建表
	_, err = db.Exec(`
		CREATE TABLE users (
			id INTEGER PRIMARY KEY,
			name TEXT NOT NULL,
			age INTEGER NOT NULL,
			email TEXT
		);
	`)
	if err != nil {
		return nil, fmt.Errorf("创建表失败: %w", err)
	}

	// 插入示例数据
	_, err = db.Exec(`
		INSERT INTO users (name, age, email) VALUES
		('张三', 28, 'zhangsan@example.com'),
		('李四', 35, 'lisi@example.com'),
		('王五', 42, 'wangwu@example.com'),
		('赵六', 25, 'zhaoliu@example.com');
	`)
	if err != nil {
		return nil, fmt.Errorf("插入数据失败: %w", err)
	}

	return db, nil
}
```

### 示例文档数据

用于各种文档处理示例：

```go
var docs = []schema.Document{
	{PageContent: "LangChain是一个用于开发由语言模型驱动的应用程序的框架。它可以帮助开发人员使用语言模型构建端到端的应用程序。"},
	{PageContent: "LangChain提供了多种组件，如提示模板、LLM封装、链、代理等，使开发人员能够轻松地将这些组件组合在一起。"},
	{PageContent: "LangChain支持多种语言，包括Python和Go。LangChainGo是LangChain的Go语言实现。"},
	{PageContent: "LangChain的核心概念包括链（Chain）、代理（Agent）、内存（Memory）等。这些概念使得开发人员可以构建复杂的语言处理流程。"},
}
```

---

## 🚀 快速开始指南

### 1. 安装依赖

```bash
go mod init your-project
go get github.com/tmc/langchaingo
go get github.com/mattn/go-sqlite3
```

### 2. 设置环境变量

```bash
export OPENAI_API_KEY="your-openai-api-key"
```

### 3. 选择合适的链类型

| 场景 | 推荐链类型 | 特点 |
|------|-----------|------|
| 简单问答 | `LLMChain` | 直接、快速 |
| 多步骤处理 | `SequentialChain` | 模块化、可控 |
| 大量文档处理 | `MapReduceDocuments` | 并行、高效 |
| 知识库问答 | `RetrievalQA` | 准确、相关 |
| 对话系统 | `ConversationalRetrievalQA` + Memory | 上下文、连续 |
| 数学计算 | `LLMMathChain` | 专业、可靠 |
| 数据库查询 | `SQLDatabaseChain` | 自然语言转SQL |

---

## 💡 最佳实践

### 1. 错误处理
- 始终检查链创建和执行的错误
- 为网络相关操作添加超时和重试机制
- 优雅地处理API限制和配额问题

### 2. 性能优化
- 对于大量数据，使用 `MapReduceDocuments` 而不是 `StuffDocuments`
- 利用并行处理功能提高吞吐量
- 合理配置向量存储的索引参数

### 3. 内存管理
- 根据应用需求选择合适的内存类型
- 定期清理不需要的对话历史
- 监控内存使用量避免过度消耗

### 4. 提示词优化
- 使用清晰、具体的提示词模板
- 提供足够的上下文信息
- 测试不同的提示词格式以获得最佳效果

---

## 📚 总结

本文档详细展示了 LangChainGo `chains` 包的各种功能：

1. **基础链**：`LLMChain` 和 `Transform` 提供基础功能
2. **顺序链**：支持复杂的多步骤处理流程
3. **文档处理链**：三种策略应对不同规模的文档处理需求
4. **特定任务链**：为常见应用场景提供专门的解决方案
5. **内存管理**：支持有状态的对话和上下文处理
6. **并行处理**：提高大规模数据处理的效率

通过合理组合这些链类型，可以构建出功能强大、性能优秀的LLM应用程序。每个链都有其特定的使用场景和优势，选择合适的链类型是成功实现应用的关键。