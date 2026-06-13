// features/create/ui/components/create-challenge-form/CreateChallengeForm.tsx
// v6.61: プリセット選択機能追加

import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { navigate } from "@/lib/navigation";
import { color } from "@/theme/tokens";
import { useAuth } from "@/hooks/use-auth";
import { NumberStepper } from "@/components/molecules/number-stepper";
import { PresetSelector } from "@/components/molecules/preset-selector";
import {
  EventTypeSelector,
  GoalTypeSelector,
  CategorySelector,
  GenreSelector,
  PurposeSelector,
  TicketInfoSection,
  TemplateSaveSection,
} from "../index";
import { TwitterLoginSection } from "./TwitterLoginSection";
import { UserInfoSection } from "./UserInfoSection";
import { TitleInputSection } from "./TitleInputSection";
import { DateInputSection } from "./DateInputSection";
import { VenueInputSection } from "./VenueInputSection";
import { ExternalUrlSection } from "./ExternalUrlSection";
import { DescriptionSection } from "./DescriptionSection";
import { CreateButtonSection } from "./CreateButtonSection";
import { TemplateLinkSection } from "./TemplateLinkSection";
import type { CreateChallengeFormProps } from "./types";

/**
 * チャレンジ作成フォーム
 * 各セクションを組み合わせたメインコンポーネント
 */
export function CreateChallengeForm({
  state,
  updateField,
  handleGoalTypeChange,
  applyPreset,
  handleCreate,
  validationErrors,
  isPending,
  categoriesData,
  isCategoriesLoading,
  isDesktop,
  titleInputRef,
  dateInputRef,
  loginSectionRef,
  onLoginOpen,
}: CreateChallengeFormProps) {
  
  const { user, login, isAuthReady } = useAuth();
  const loginAction = onLoginOpen ?? login;
  const showHostError = validationErrors.some((e) => e.field === "host");
  const hasCategories = Array.isArray(categoriesData) && categoriesData.length > 0;
  // 認証確定後のみログイン/ユーザーセクションを切り替えて点滅防止
  const showLoginSection = isAuthReady && !user;
  const showUserSection = isAuthReady && user;

  return (
    <View
      style={{
        backgroundColor: color.surface,
        marginHorizontal: isDesktop ? "auto" : 16,
        marginVertical: 16,
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: color.border,
        maxWidth: isDesktop ? 800 : undefined,
        width: isDesktop ? "100%" : undefined,
      }}
    >
      {/* グラデーションヘッダー */}
      <LinearGradient
        colors={[color.accentPrimary, color.accentAlt]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ height: 4 }}
      />

      <View style={{ padding: 16 }}>
        {/* ログインセクション（認証確定後のみ表示して点滅防止） */}
        {showLoginSection && (
          <TwitterLoginSection
            onLogin={loginAction}
            showHostError={showHostError}
            innerRef={loginSectionRef}
          />
        )}
        {showUserSection && user && <UserInfoSection user={user} />}
        {!isAuthReady && <View style={{ height: 1, marginBottom: 15 }} />}

        {/* プリセット選択（かんたん設定） */}
        {applyPreset && (
          <PresetSelector
            selectedPresetId={state.selectedPresetId}
            onSelectPreset={applyPreset}
          />
        )}

        {/* イベントタイプ選択 */}
        <EventTypeSelector
          value={state.eventType}
          onChange={(v) => updateField("eventType", v)}
        />

        {/* カテゴリ選択（管理側でカテゴリがある場合のみ表示・活動ジャンルと役割を分離） */}
        {hasCategories && (
          <CategorySelector
            categoryId={state.categoryId}
            categories={categoriesData}
            showList={state.showCategoryList}
            onToggleList={() => updateField("showCategoryList", !state.showCategoryList)}
            onSelect={(id) => {
              updateField("categoryId", id);
              updateField("showCategoryList", false);
            }}
            isLoading={isCategoriesLoading}
          />
        )}

        {/* ジャンル選択 */}
        <GenreSelector
          selectedGenre={state.genre}
          onSelect={(v) => updateField("genre", v)}
        />

        {/* 目的選択 */}
        <PurposeSelector
          selectedPurpose={state.purpose}
          onSelect={(v) => updateField("purpose", v)}
        />

        {/* チャレンジ名 */}
        <TitleInputSection
          value={state.title}
          onChange={(v) => updateField("title", v)}
          showValidationError={state.showValidationError}
          inputRef={titleInputRef}
        />

        {/* 目標タイプ選択 */}
        <GoalTypeSelector
          goalType={state.goalType}
          goalUnit={state.goalUnit}
          onGoalTypeChange={handleGoalTypeChange}
          onGoalUnitChange={(v) => updateField("goalUnit", v)}
        />

        {/* 目標数値 */}
        <NumberStepper
          value={state.goalValue}
          onChange={(v) => updateField("goalValue", v)}
          min={1}
          max={100000}
          step={10}
          unit={state.goalUnit || "人"}
          label="目標数値 *"
          presets={
            state.goalType === "attendance"
              ? [50, 100, 200, 500, 1000]
              : state.goalType === "viewers"
              ? [100, 500, 1000, 5000, 10000]
              : [50, 100, 500, 1000, 5000]
          }
        />

        {/* 開催日 */}
        <DateInputSection
          value={state.eventDateStr}
          onChange={(v) => updateField("eventDateStr", v)}
          showValidationError={state.showValidationError}
          inputRef={dateInputRef}
        />

        {/* 開催場所 */}
        <VenueInputSection
          value={state.venue}
          onChange={(v) => updateField("venue", v)}
        />

        {/* 外部URL */}
        <ExternalUrlSection
          value={state.externalUrl}
          onChange={(v) => updateField("externalUrl", v)}
        />

        {/* チケット情報セクション */}
        {state.goalType === "attendance" && (
          <TicketInfoSection
            ticketPresale={state.ticketPresale}
            ticketDoor={state.ticketDoor}
            ticketUrl={state.ticketUrl}
            onTicketPresaleChange={(v) => updateField("ticketPresale", v)}
            onTicketDoorChange={(v) => updateField("ticketDoor", v)}
            onTicketUrlChange={(v) => updateField("ticketUrl", v)}
          />
        )}

        {/* チャレンジ説明 */}
        <DescriptionSection
          value={state.description}
          onChange={(v) => updateField("description", v)}
        />

        {/* テンプレート保存オプション（認証確定後のみで点滅防止） */}
        {showUserSection && user && (
          <TemplateSaveSection
            saveAsTemplate={state.saveAsTemplate}
            templateName={state.templateName}
            templateIsPublic={state.templateIsPublic}
            onSaveAsTemplateChange={(v) => updateField("saveAsTemplate", v)}
            onTemplateNameChange={(v) => updateField("templateName", v)}
            onTemplateIsPublicChange={(v) => updateField("templateIsPublic", v)}
          />
        )}

        {/* 作成ボタン */}
        <CreateButtonSection onPress={handleCreate} isPending={isPending} />

        {/* テンプレート一覧へのリンク */}
        <TemplateLinkSection onPress={() => navigate.toTemplates()} />
      </View>
    </View>
  );
}
