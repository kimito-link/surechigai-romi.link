/**
 * CompanionAddSection Component
 * 友人追加部分（友人リスト、追加フォーム、Twitter検索）
 * 
 * 分割されたサブコンポーネント:
 * - TwitterSearchForm: Twitter検索フォーム
 * - CompanionList: 友人リスト
 * - ContributionDisplay: 貢献人数表示
 */

import { View } from "react-native";
import { SectionHeader } from "@/components/ui";
import { Button } from "@/components/ui/button";
import type { Companion, LookedUpProfile } from "../types";
import {
  TwitterSearchForm,
  CompanionList,
  ContributionDisplay,
} from "./companion";

interface CompanionAddSectionProps {
  companions: Companion[];
  showAddCompanionForm: boolean;
  setShowAddCompanionForm: (value: boolean) => void;
  newCompanionName: string;
  setNewCompanionName: (value: string) => void;
  newCompanionTwitter: string;
  setNewCompanionTwitter: (value: string) => void;
  isLookingUpTwitter: boolean;
  lookupError: string | null;
  lookedUpProfile: LookedUpProfile | null;
  setLookedUpProfile: (value: LookedUpProfile | null) => void;
  setLookupError: (value: string | null) => void;
  onAddCompanion: () => void;
  onRemoveCompanion: (id: string) => void;
  onLookupTwitterProfile: (input: string) => Promise<void>;
}

export function CompanionAddSection({
  companions,
  showAddCompanionForm,
  setShowAddCompanionForm,
  newCompanionName,
  setNewCompanionName,
  newCompanionTwitter,
  setNewCompanionTwitter,
  isLookingUpTwitter,
  lookupError,
  lookedUpProfile,
  setLookedUpProfile,
  setLookupError,
  onAddCompanion,
  onRemoveCompanion,
  onLookupTwitterProfile,
}: CompanionAddSectionProps) {
  // フォームをキャンセルしてリセット
  const handleCancelForm = () => {
    setShowAddCompanionForm(false);
    setNewCompanionName("");
    setNewCompanionTwitter("");
    setLookedUpProfile(null);
    setLookupError(null);
  };
  
  return (
    <View style={{ marginBottom: 16 }}>
      <SectionHeader
        title="一緒に参加する友人（任意）"
        action={
          <Button
            variant="outline"
            size="sm"
            icon="person-add"
            iconPosition="left"
            onPress={() => setShowAddCompanionForm(true)}
          >
            友人を追加
          </Button>
        }
        style={{ marginBottom: 12 }}
      />

      {/* 友人追加フォーム */}
      {showAddCompanionForm && (
        <TwitterSearchForm
          newCompanionName={newCompanionName}
          setNewCompanionName={setNewCompanionName}
          newCompanionTwitter={newCompanionTwitter}
          setNewCompanionTwitter={setNewCompanionTwitter}
          isLookingUpTwitter={isLookingUpTwitter}
          lookupError={lookupError}
          lookedUpProfile={lookedUpProfile}
          setLookedUpProfile={setLookedUpProfile}
          setLookupError={setLookupError}
          onAdd={onAddCompanion}
          onCancel={handleCancelForm}
          onLookup={onLookupTwitterProfile}
        />
      )}

      {/* 登録済み友人リスト */}
      <CompanionList
        companions={companions}
        onRemoveCompanion={onRemoveCompanion}
      />

      {/* 貢献人数表示 */}
      <ContributionDisplay companionCount={companions.length} />
    </View>
  );
}
