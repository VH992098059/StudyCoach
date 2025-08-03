package studyCoach

import (
	"context"
	"fmt"
	"studyCoach/studyCoach/api"
	"testing"
)

// 新增测试函数：专门测试等待用户输入的逻辑
func TestWaitingUserInput(t *testing.T) {
	// 设置waiting_user_input状态来测试循环检测逻辑
	ctx := context.Background()

	// 这个调用应该会在BackChatTemplateLambda中被检测到waiting_user_input状态
	// 但由于API层面的处理，可能不会直接触发到newLambda7的循环检测
	fmt.Println(api.ChatAiModel(ctx, true, "现在我要学习vue，帮我整理核心内容，规划学习路线并说出这些核心组件的详情作用", "12313", "test"))
}
