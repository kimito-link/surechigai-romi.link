/**
 * カテゴリ管理画面
 * 
 * カテゴリの追加・編集・削除
 */

import { ScreenContainer } from "@/components/organisms/screen-container";
import { RefreshingIndicator } from "@/components/molecules/refreshing-indicator";
import { ScreenLoadingState } from "@/components/ui";
import { commonCopy } from "@/constants/copy/common";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";
import { useLoadingState } from "@/hooks/use-loading-state";
import { trpc } from "@/lib/trpc";
import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export default function CategoriesScreen() {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // カテゴリ一覧を取得
  const { data: categories, isLoading, isFetching, refetch } = trpc.categories.list.useQuery();
  
  // ローディング状態を分離
  const hasData = !!categories && categories.length >= 0;
  const loadingState = useLoadingState({
    isLoading,
    isFetching,
    hasData,
  });
  
  // カテゴリ作成
  const createMutation = trpc.categories.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowAddForm(false);
      setNewName("");
      setNewSlug("");
      setNewDescription("");
    },
    onError: (error) => {
      Alert.alert(commonCopy.alerts.error, error.message);
    },
  });

  // カテゴリ更新
  const updateMutation = trpc.categories.update.useMutation({
    onSuccess: () => {
      refetch();
      setEditingId(null);
    },
    onError: (error) => {
      Alert.alert(commonCopy.alerts.error, error.message);
    },
  });

  // カテゴリ削除
  const deleteMutation = trpc.categories.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      Alert.alert(commonCopy.alerts.error, error.message);
    },
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditSlug(category.slug);
    setEditDescription(category.description || "");
  };

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim()) return;
    
    updateMutation.mutate({
      id: editingId,
      name: editName.trim(),
      slug: editSlug.trim() || editName.trim().toLowerCase().replace(/\s+/g, "-"),
      description: editDescription.trim() || undefined,
    });
  };

  const handleDelete = (category: Category) => {
    const confirmDelete = () => {
      deleteMutation.mutate({ id: category.id });
    };

    if (Platform.OS === "web") {
      if (window.confirm(`「${category.name}」を削除しますか？`)) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        commonCopy.alerts.deleteConfirm,
        `「${category.name}」を削除しますか？`,
        [
          { text: "キャンセル", style: "cancel" },
          { text: "削除", style: "destructive", onPress: confirmDelete },
        ]
      );
    }
  };

  const handleCreate = () => {
    if (!newName.trim()) {
      Alert.alert(commonCopy.alerts.error, "カテゴリ名を入力してください");
      return;
    }
    
    createMutation.mutate({
      name: newName.trim(),
      slug: newSlug.trim() || newName.trim().toLowerCase().replace(/\s+/g, "-"),
      description: newDescription.trim() || undefined,
    });
  };

  if (loadingState.isInitialLoading) {
    return <ScreenLoadingState message={commonCopy.loading.categories} />;
  }

  return (
    <ScreenContainer>
      {loadingState.isRefreshing && <RefreshingIndicator isRefreshing={loadingState.isRefreshing} />}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ヘッダー */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-2xl font-bold text-foreground">カテゴリ管理</Text>
            <Text className="text-sm text-muted mt-1">
              {categories?.length || 0} 件のカテゴリ
            </Text>
          </View>
          <Pressable
            onPress={() => setShowAddForm(!showAddForm)}
            style={({ pressed }) => ({
              backgroundColor: showAddForm ? colors.muted : colors.primary,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 8,
              flexDirection: "row",
              alignItems: "center",
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Ionicons
              name={showAddForm ? "close" : "add"}
              size={20}
              color={color.textWhite}
            />
            <Text className="text-white font-semibold ml-1">
              {showAddForm ? "閉じる" : "追加"}
            </Text>
          </Pressable>
        </View>

        {/* 新規追加フォーム */}
        {showAddForm && (
          <View className="bg-surface rounded-xl p-4 border border-border mb-6">
            <Text className="text-lg font-semibold text-foreground mb-4">
              新規カテゴリ
            </Text>
            
            <View className="mb-4">
              <Text className="text-sm text-muted mb-1">カテゴリ名 *</Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="例: ライブ・コンサート"
                placeholderTextColor={colors.muted}
                className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
              />
            </View>
            
            <View className="mb-4">
              <Text className="text-sm text-muted mb-1">スラッグ（URL用）</Text>
              <TextInput
                value={newSlug}
                onChangeText={setNewSlug}
                placeholder="例: live-concert"
                placeholderTextColor={colors.muted}
                className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                autoCapitalize="none"
              />
            </View>
            
            <View className="mb-4">
              <Text className="text-sm text-muted mb-1">説明</Text>
              <TextInput
                value={newDescription}
                onChangeText={setNewDescription}
                placeholder="カテゴリの説明（任意）"
                placeholderTextColor={colors.muted}
                className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                multiline
                numberOfLines={2}
              />
            </View>
            
            <Pressable
              onPress={handleCreate}
              disabled={createMutation.isPending}
              style={({ pressed }) => ({
                backgroundColor: colors.primary,
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: "center",
                opacity: pressed || createMutation.isPending ? 0.7 : 1,
              })}
            >
              {createMutation.isPending ? (
                <ActivityIndicator color={color.textWhite} />
              ) : (
                <Text className="text-white font-semibold">作成</Text>
              )}
            </Pressable>
          </View>
        )}

        {/* カテゴリリスト */}
        {categories && categories.length > 0 ? (
          <View className="gap-3">
            {categories.map((category: Category) => (
              <View
                key={category.id}
                className="bg-surface rounded-xl border border-border overflow-hidden"
              >
                {editingId === category.id ? (
                  // 編集モード
                  <View className="p-4">
                    <View className="mb-3">
                      <Text className="text-sm text-muted mb-1">カテゴリ名</Text>
                      <TextInput
                        value={editName}
                        onChangeText={setEditName}
                        className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                      />
                    </View>
                    
                    <View className="mb-3">
                      <Text className="text-sm text-muted mb-1">スラッグ</Text>
                      <TextInput
                        value={editSlug}
                        onChangeText={setEditSlug}
                        className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                        autoCapitalize="none"
                      />
                    </View>
                    
                    <View className="mb-4">
                      <Text className="text-sm text-muted mb-1">説明</Text>
                      <TextInput
                        value={editDescription}
                        onChangeText={setEditDescription}
                        className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                        multiline
                      />
                    </View>
                    
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => setEditingId(null)}
                        style={({ pressed }) => ({
                          flex: 1,
                          backgroundColor: colors.muted + "20",
                          paddingVertical: 10,
                          borderRadius: 8,
                          alignItems: "center",
                          opacity: pressed ? 0.8 : 1,
                        })}
                      >
                        <Text style={{ color: colors.muted }}>キャンセル</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleSaveEdit}
                        disabled={updateMutation.isPending}
                        style={({ pressed }) => ({
                          flex: 1,
                          backgroundColor: colors.primary,
                          paddingVertical: 10,
                          borderRadius: 8,
                          alignItems: "center",
                          opacity: pressed || updateMutation.isPending ? 0.7 : 1,
                        })}
                      >
                        {updateMutation.isPending ? (
                          <ActivityIndicator color={color.textWhite} size="small" />
                        ) : (
                          <Text className="text-white font-semibold">保存</Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  // 表示モード
                  <View className="p-4">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <Text className="text-lg font-semibold text-foreground">
                            {category.name}
                          </Text>
                          {!category.isActive && (
                            <View
                              className="ml-2 px-2 py-0.5 rounded"
                              style={{ backgroundColor: colors.muted + "20" }}
                            >
                              <Text className="text-xs" style={{ color: colors.muted }}>
                                非表示
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-sm text-muted mt-1">
                          /{category.slug}
                        </Text>
                        {category.description && (
                          <Text className="text-sm text-muted mt-2">
                            {category.description}
                          </Text>
                        )}
                      </View>
                      
                      <View className="flex-row gap-2">
                        <Pressable
                          onPress={() => handleEdit(category)}
                          style={({ pressed }) => ({
                            padding: 8,
                            borderRadius: 8,
                            backgroundColor: colors.primary + "20",
                            opacity: pressed ? 0.7 : 1,
                          })}
                        >
                          <Ionicons name="pencil" size={18} color={colors.primary} />
                        </Pressable>
                        <Pressable
                          onPress={() => handleDelete(category)}
                          disabled={deleteMutation.isPending}
                          style={({ pressed }) => ({
                            padding: 8,
                            borderRadius: 8,
                            backgroundColor: colors.error + "20",
                            opacity: pressed || deleteMutation.isPending ? 0.7 : 1,
                          })}
                        >
                          <Ionicons name="trash" size={18} color={colors.error} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-surface rounded-xl p-8 items-center border border-border">
            <Ionicons name="pricetags-outline" size={48} color={colors.muted} />
            <Text className="text-lg font-semibold text-foreground mt-4">
              {commonCopy.empty.noCategories}
            </Text>
            <Text className="text-muted text-center mt-2">
              「追加」ボタンから新しいカテゴリを作成してください
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
