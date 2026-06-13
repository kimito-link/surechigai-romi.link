/**
 * CharacterIconRow Component (Login Screen Wrapper)
 * ログイン画面用のデフォルト3キャラクター設定を提供
 * タップでキャラクター詳細モーダルを表示
 */

import { useState } from "react";
import { 
  CharacterIconRow as BaseCharacterIconRow,
  type CharacterIconConfig,
} from "@/components/ui/character-icon-row";
import { CharacterDetailModal, type CharacterInfo } from "@/components/ui/character-detail-modal";
import { mypageAccent } from "../../ui/theme/tokens";
import { characterImages, characterDetails } from "./constants";

// キャラクターIDとアイコン設定のマッピング
type CharacterIconWithId = CharacterIconConfig & { characterId: string };

// デフォルトの3キャラクター設定（主役・りんくを中央に配置）
const defaultLoginIcons: CharacterIconWithId[] = [
  {
    id: "konta",
    characterId: "konta",
    image: characterImages.kontaYukkuri,
    size: 56,
    borderWidth: 2,
    borderColor: mypageAccent.kontaOrange,
    name: "こん太",
  },
  {
    id: "link",
    characterId: "link",
    image: characterImages.linkYukkuri,
    size: 64,
    borderWidth: 3,
    borderColor: mypageAccent.linkPink,
    name: "りんく",
  },
  {
    id: "tanune",
    characterId: "tanune",
    image: characterImages.tanuneYukkuri,
    size: 56,
    borderWidth: 2,
    borderColor: mypageAccent.tanuneGreen,
    name: "たぬ姉",
  },
];

interface LoginCharacterIconRowProps {
  /** 下部マージン */
  marginBottom?: number;
}

/**
 * ログイン画面用のキャラクターアイコン行
 * デフォルトで3キャラクター（りんく、こん太、たぬ姉）を表示
 * タップするとキャラクター詳細モーダルを表示
 */
export function CharacterIconRow({ marginBottom = 32 }: LoginCharacterIconRowProps = {}) {
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterInfo | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleIconPress = (icon: CharacterIconConfig) => {
    const iconWithId = icon as CharacterIconWithId;
    const characterInfo = characterDetails[iconWithId.characterId];
    if (characterInfo) {
      setSelectedCharacter(characterInfo);
      setModalVisible(true);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedCharacter(null);
  };

  return (
    <>
      <BaseCharacterIconRow
        icons={defaultLoginIcons}
        gap={12}
        marginBottom={marginBottom}
        pressable
        onIconPress={handleIconPress}
      />
      <CharacterDetailModal
        visible={modalVisible}
        onClose={handleCloseModal}
        character={selectedCharacter}
      />
    </>
  );
}
