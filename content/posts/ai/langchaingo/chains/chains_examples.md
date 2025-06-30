---
title: "LangChainGo Chains Examples"
date: 2025-06-30T10:00:00+08:00  # 日期格式正确
author: "AI助手"
description: "提供了LangChainGo的chains包使用的一些用例"
tags: ["LangChainGo", "Go", "架构分析", "Chains"]
categories: ["ai", 'langchaingo', "chains"]
draft: false
---

# LangChainGo Chains 包功能展示

以下是一个综合用例，展示了 LangChainGo `chains` 包的主要功能和用法。这个用例包含了基础链、文档处理链、特定任务链和内存管理等方面的示例代码。

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

	// 1. 基础链示例
	basicChainExample(ctx, llm)

	// 2. 顺序链示例
	sequentialChainExample(ctx, llm)

	// 3. 文档处理链示例
	documentChainsExample(ctx, llm)

	// 4. 特定任务链示例
	specificTaskChainsExample(ctx, llm)

	// 5. 内存管理示例
	memoryManagementExample(ctx, llm)

	// 6. 并行处理示例
	parallelProcessingExample(ctx, llm)
}

// 1. 基础链示例：LLMChain和Transform链
func basicChainExample(ctx context.Context, llm llms.Model) {
	fmt.Println("\n=== 基础链示例 ===")

	// 1.1 LLMChain示例
	promptTemplate := prompts.NewPromptTemplate(
		"你是一个有用的AI助手。请回答以下问题: {question}",
		[]string{"question"},
	)

	llmChain := chains.NewLLMChain(llm, promptTemplate)
	result, err := chains.Run(ctx, llmChain, "什么是LangChain?")
	if err != nil {
		log.Fatalf("执行LLMChain失败: %v", err)
	}
	fmt.Printf("LLMChain结果: %s\n", result)

	// 1.2 Transform链示例
	transformChain := chains.NewTransform(
		// 转换函数，将输入文本转换为大写
		func(ctx context.Context, input map[string]any) (map[string]any, error) {
			text, ok := input["text"].(string)
			if !ok {
				return nil, fmt.Errorf("输入必须包含'text'字段")
			}
			return map[string]any{"result": strings.ToUpper(text)}, nil
		},
		[]string{"text"},      // 输入键
		[]string{"result"},   // 输出键
	)

	transformResult, err := chains.Run(ctx, transformChain, "hello world")
	if err != nil {
		log.Fatalf("执行Transform链失败: %v", err)
	}
	fmt.Printf("Transform链结果: %s\n", transformResult)
}

// 2. 顺序链示例：SequentialChain和SimpleSequentialChain
func sequentialChainExample(ctx context.Context, llm llms.Model) {
	fmt.Println("\n=== 顺序链示例 ===")

	// 2.1 SimpleSequentialChain示例
	// 第一个链：生成一个故事大纲
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
	simpleSeqResult, err := chains.Run(ctx, simpleSeqChain, "太空探险")
	if err != nil {
		log.Fatalf("执行SimpleSequentialChain失败: %v", err)
	}
	fmt.Printf("SimpleSequentialChain结果: \n%s\n", simpleSeqResult)

	// 2.2 SequentialChain示例
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

// 3. 文档处理链示例：StuffDocuments、RefineDocuments和MapReduceDocuments
func documentChainsExample(ctx context.Context, llm llms.Model) {
	fmt.Println("\n=== 文档处理链示例 ===")

	// 准备示例文档
	docs := []schema.Document{
		{PageContent: "LangChain是一个用于开发由语言模型驱动的应用程序的框架。它可以帮助开发人员使用语言模型构建端到端的应用程序。"},
		{PageContent: "LangChain提供了多种组件，如提示模板、LLM封装、链、代理等，使开发人员能够轻松地将这些组件组合在一起。"},
		{PageContent: "LangChain支持多种语言，包括Python和Go。LangChainGo是LangChain的Go语言实现。"},
		{PageContent: "LangChain的核心概念包括链（Chain）、代理（Agent）、内存（Memory）等。这些概念使得开发人员可以构建复杂的语言处理流程。"},
	}

	// 3.1 StuffDocuments示例
	stuffPrompt := prompts.NewPromptTemplate(
		"根据以下文档回答问题：\n{documents}\n\n问题: {question}\n回答:",
		[]string{"documents", "question"},
	)
	stuffChain := chains.NewStuffDocuments(chains.NewLLMChain(llm, stuffPrompt))
	stuffResult, err := chains.Call(ctx, stuffChain, map[string]any{
		"input_documents": docs,
		"question":        "LangChain的核心概念是什么？",
	})
	if err != nil {
		log.Fatalf("执行StuffDocuments失败: %v", err)
	}
	fmt.Printf("StuffDocuments结果: \n%s\n", stuffResult["text"])

	// 3.2 RefineDocuments示例
	initialPrompt := prompts.NewPromptTemplate(
		"根据以下文档回答问题：\n{document}\n\n问题: {question}\n回答:",
		[]string{"document", "question"},
	)
	refinePrompt := prompts.NewPromptTemplate(
		"根据以下新文档完善你的答案。\n\n原始答案: {existing_answer}\n新文档: {document}\n\n问题: {question}\n更新后的答案:",
		[]string{"existing_answer", "document", "question"},
	)
	refineChain := chains.NewRefineDocuments(
		chains.NewLLMChain(llm, initialPrompt),
		chains.NewLLMChain(llm, refinePrompt),
	)
	refineResult, err := chains.Call(ctx, refineChain, map[string]any{
		"input_documents": docs,
		"question":        "LangChain支持哪些语言？",
	})
	if err != nil {
		log.Fatalf("执行RefineDocuments失败: %v", err)
	}
	fmt.Printf("RefineDocuments结果: \n%s\n", refineResult["text"])

	// 3.3 MapReduceDocuments示例
	mapPrompt := prompts.NewPromptTemplate(
		"根据以下文档提取关键信息：\n{document}\n\n关键信息:",
		[]string{"document"},
	)
	reducePrompt := prompts.NewPromptTemplate(
		"根据以下提取的关键信息，综合回答问题：\n{documents}\n\n问题: {question}\n回答:",
		[]string{"documents", "question"},
	)
	mapChain := chains.NewLLMChain(llm, mapPrompt)
	reduceChain := chains.NewStuffDocuments(chains.NewLLMChain(llm, reducePrompt))

	mapReduceChain := chains.NewMapReduceDocuments(mapChain, reduceChain)
	mapReduceResult, err := chains.Call(ctx, mapReduceChain, map[string]any{
		"input_documents": docs,
		"question":        "简要概括LangChain是什么？",
	})
	if err != nil {
		log.Fatalf("执行MapReduceDocuments失败: %v", err)
	}
	fmt.Printf("MapReduceDocuments结果: \n%s\n", mapReduceResult["text"])
}

// 4. 特定任务链示例：LLMMathChain、RetrievalQA、SQLDatabaseChain和APIChain
func specificTaskChainsExample(ctx context.Context, llm llms.Model) {
	fmt.Println("\n=== 特定任务链示例 ===")

	// 4.1 LLMMathChain示例
	mathChain := chains.NewLLMMathChain(llm)
	mathResult, err := chains.Run(ctx, mathChain, "如果我有5个苹果，每个苹果重150克，总重量是多少千克？")
	if err != nil {
		log.Fatalf("执行LLMMathChain失败: %v", err)
	}
	fmt.Printf("LLMMathChain结果: %s\n", mathResult)

	// 4.2 RetrievalQA示例（需要先创建向量存储）
	// 创建嵌入模型
	embedder, err := openai.NewEmbedder()
	if err != nil {
		log.Printf("创建嵌入模型失败: %v，跳过RetrievalQA示例", err)
	} else {
		// 创建向量存储
		vectorStore, err := createVectorStore(ctx, embedder, docs)
		if err != nil {
			log.Printf("创建向量存储失败: %v，跳过RetrievalQA示例", err)
		} else {
			// 创建RetrievalQA链
			retrievalQA, err := chains.NewRetrievalQAFromLLM(llm, vectorStore.AsRetriever())
			if err != nil {
				log.Fatalf("创建RetrievalQA失败: %v", err)
			}

			qaResult, err := chains.Run(ctx, retrievalQA, "LangChain的主要组件有哪些？")
			if err != nil {
				log.Fatalf("执行RetrievalQA失败: %v", err)
			}
			fmt.Printf("RetrievalQA结果: %s\n", qaResult)

			// 4.3 ConversationalRetrievalQA示例
			mem := memory.NewConversationBuffer()
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
			fmt.Printf("ConversationalRetrievalQA结果1: %s\n", convResult1)

			// 第二个问题（引用上下文）
			convResult2, err := chains.Run(ctx, convQA, "它支持哪些语言？")
			if err != nil {
				log.Fatalf("执行ConversationalRetrievalQA失败: %v", err)
			}
			fmt.Printf("ConversationalRetrievalQA结果2: %s\n", convResult2)
		}
	}

	// 4.4 SQLDatabaseChain示例
	// 创建示例SQLite数据库
	db, err := createSampleDatabase()
	if err != nil {
		log.Printf("创建示例数据库失败: %v，跳过SQLDatabaseChain示例", err)
	} else {
		defer db.Close()

		// 创建SQLDatabaseChain
		sqlChain, err := chains.NewSQLDatabaseChain(llm, db, "users")
		if err != nil {
			log.Fatalf("创建SQLDatabaseChain失败: %v", err)
		}

		sqlResult, err := chains.Run(ctx, sqlChain, "有多少用户年龄超过30岁？")
		if err != nil {
			log.Fatalf("执行SQLDatabaseChain失败: %v", err)
		}
		fmt.Printf("SQLDatabaseChain结果: %s\n", sqlResult)
	}

	// 4.5 APIChain示例
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

	apiChain, err := chains.NewAPIChain(llm, apiSpec, true)
	if err != nil {
		log.Fatalf("创建APIChain失败: %v", err)
	}

	// 注意：这里不会真正发送API请求，只会生成请求和解析响应的代码
	apiResult, err := chains.Run(ctx, apiChain, "获取北京的天气信息")
	if err != nil {
		log.Fatalf("执行APIChain失败: %v", err)
	}
	fmt.Printf("APIChain结果: %s\n", apiResult)
}

// 5. 内存管理示例：使用ConversationBuffer内存
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
	fmt.Printf("对话1 - 人类: 你好，我叫小明。\n对话1 - AI: %s\n", result1["text"])

	// 第二轮对话（引用上下文）
	result2, err := chains.Call(ctx, conversationChain, map[string]any{
		"human_input": "你还记得我的名字吗？",
	})
	if err != nil {
		log.Fatalf("执行对话失败: %v", err)
	}
	fmt.Printf("对话2 - 人类: 你还记得我的名字吗？\n对话2 - AI: %s\n", result2["text"])

	// 清除内存
	err = mem.Clear(ctx)
	if err != nil {
		log.Fatalf("清除内存失败: %v", err)
	}

	// 第三轮对话（内存已清除）
	result3, err := chains.Call(ctx, conversationChain, map[string]any{
		"human_input": "你还记得我的名字吗？",
	})
	if err != nil {
		log.Fatalf("执行对话失败: %v", err)
	}
	fmt.Printf("对话3 - 人类: 你还记得我的名字吗？\n对话3 - AI: %s\n", result3["text"])
}

// 6. 并行处理示例：使用Apply函数并行执行链
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

	// 并行执行链
	results, err := chains.Apply(ctx, llmChain, inputs, 2) // 最多2个并发worker
	if err != nil {
		log.Fatalf("并行执行链失败: %v", err)
	}

	// 打印结果
	fmt.Println("并行处理结果:")
	for i, result := range results {
		fmt.Printf("主题: %s\n描述: %s\n", inputs[i]["topic"], result["text"])
	}
}

// 辅助函数：创建向量存储
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

// 辅助函数：创建示例SQLite数据库
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

// 示例文档，用于RetrievalQA示例
var docs = []schema.Document{
	{PageContent: "LangChain是一个用于开发由语言模型驱动的应用程序的框架。它可以帮助开发人员使用语言模型构建端到端的应用程序。"},
	{PageContent: "LangChain提供了多种组件，如提示模板、LLM封装、链、代理等，使开发人员能够轻松地将这些组件组合在一起。"},
	{PageContent: "LangChain支持多种语言，包括Python和Go。LangChainGo是LangChain的Go语言实现。"},
	{PageContent: "LangChain的核心概念包括链（Chain）、代理（Agent）、内存（Memory）等。这些概念使得开发人员可以构建复杂的语言处理流程。"},
}
```

## 用例说明

上述综合用例展示了LangChainGo `chains` 包的主要功能和用法，包括：

1. **基础链**
   - `LLMChain`：最基础的链类型，直接与语言模型交互
   - `Transform`：执行任意转换逻辑的链

2. **顺序链**
   - `SimpleSequentialChain`：简化版顺序链，每个子链只有一个输入和一个输出
   - `SequentialChain`：更灵活的顺序链，支持多个输入和输出键

3. **文档处理链**
   - `StuffDocuments`：将多个文档合并后处理
   - `RefineDocuments`：通过迭代细化处理文档
   - `MapReduceDocuments`：并行处理文档后合并结果

4. **特定任务链**
   - `LLMMathChain`：解析数学表达式并计算结果
   - `RetrievalQA`：结合检索和问答功能
   - `ConversationalRetrievalQA`：带有对话历史的检索问答
   - `SQLDatabaseChain`：将自然语言转换为SQL查询
   - `APIChain`：生成API请求并解析响应

5. **内存管理**
   - 使用`ConversationBuffer`内存存储对话历史
   - 清除内存演示

6. **并行处理**
   - 使用`Apply`函数并行执行链

这个用例涵盖了`chains`包的大部分功能，展示了如何使用不同类型的链来构建复杂的语言处理流程。通过组合这些链，可以实现各种基于LLM的应用，如问答系统、对话机器人、文档摘要等。