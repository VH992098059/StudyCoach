package main

import (
	"fmt"

	"github.com/sergi/go-diff/diffmatchpatch"
)

func main() {
	fmt.Println("--- 文件内容差异比较示例 ---")

	// 模拟从 MinIO 获取的原始文件内容
	originalText := "学习计划第一天：\n1. 安装 Go 环境。\n2. 编写第一个 'Hello, World!' 程序。\n3. 学习变量和基本类型。"

	// 模拟 LLM 修改后生成的新内容
	newText := "学习计划第一天（已优化）：\n1. 安装 Go 1.22 环境并配置好 GOPATH。\n2. 编写一个简单的 HTTP 服务器作为 'Hello, World!'。\n3. 学习变量、常量和基本数据类型（int, string, bool）。\n4. (新增) 完成 5 道基础的变量练习题。"

	// 1. 创建一个 diff-match-patch 对象
	dmp := diffmatchpatch.New()

	// 2. 比较两个文本，生成差异列表
	// 第三个参数 false 表示不进行耗时的清理，对于大多数场景足够了
	diffs := dmp.DiffMain(originalText, newText, false)

	// 3. 打印出美化的、易于阅读的差异结果
	// DiffPrettyText 会用更直观的方式（如高亮）展示差异
	fmt.Println("\n--- 美化后的差异对比 ---")
	fmt.Println(dmp.DiffPrettyText(diffs))

	// 4. 逐条遍历差异列表，精确分析每一处变化
	fmt.Println("\n--- 逐条变更分析 ---")
	for _, diff := range diffs {
		// diff.Type 可以是 DiffInsert, DiffDelete, DiffEqual
		switch diff.Type {
		case diffmatchpatch.DiffInsert:
			// 绿色通常用于表示新增
			fmt.Printf("【新增部分】: %q\n", diff.Text)
		case diffmatchpatch.DiffDelete:
			// 红色通常用于表示删除
			fmt.Printf("【删除部分】: %q\n", diff.Text)
		case diffmatchpatch.DiffEqual:
			// 不变的部分
			// 为了简洁，我们这里不打印保留的部分，只关注变化
			// fmt.Printf("【保留部分】: %q\n", diff.Text)
		}
	}

	fmt.Println("\n--- 示例结束 ---")
}
