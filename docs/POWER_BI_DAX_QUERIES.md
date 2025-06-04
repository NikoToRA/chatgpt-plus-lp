# Power BI DAX クエリ集 - お問い合わせ分析

このドキュメントでは、ChatGPT Plus LP のお問い合わせデータを分析するための DAX (Data Analysis Expressions) クエリとメジャーを提供します。

## 目次

1. [基本メジャー](#基本メジャー)
2. [時系列分析](#時系列分析)
3. [病院分析](#病院分析)
4. [コンバージョン分析](#コンバージョン分析)
5. [高度な分析](#高度な分析)
6. [カスタム計算列](#カスタム計算列)
7. [パフォーマンス最適化されたメジャー](#パフォーマンス最適化されたメジャー)

## 基本メジャー

### 総数カウント

```dax
// 総問い合わせ数
TotalSubmissions = 
COUNT(FormSubmissions[SubmissionId])

// ユニーク病院数
UniqueHospitals = 
DISTINCTCOUNT(FormSubmissions[HospitalName])

// 平均スタッフ数
AverageStaffCount = 
AVERAGE(FormSubmissions[StaffCount])

// 最新の問い合わせ日時
LatestSubmission = 
MAX(FormSubmissions[Timestamp])

// 最初の問い合わせ日時
FirstSubmission = 
MIN(FormSubmissions[Timestamp])
```

### 条件付きカウント

```dax
// 大規模病院からの問い合わせ数
LargeHospitalSubmissions = 
CALCULATE(
    COUNT(FormSubmissions[SubmissionId]),
    FormSubmissions[StaffCount] >= 200
)

// 特定の興味を持つ問い合わせ数
InterestedInAI = 
CALCULATE(
    COUNT(FormSubmissions[SubmissionId]),
    FormSubmissions[Interest] = "AI診断支援"
)

// 営業時間内の問い合わせ数
BusinessHoursSubmissions = 
CALCULATE(
    COUNT(FormSubmissions[SubmissionId]),
    FILTER(
        FormSubmissions,
        HOUR(FormSubmissions[Timestamp]) >= 9 && 
        HOUR(FormSubmissions[Timestamp]) < 18
    )
)
```

## 時系列分析

### 期間別集計

```dax
// 今日の問い合わせ数
TodaySubmissions = 
CALCULATE(
    COUNT(FormSubmissions[SubmissionId]),
    FormSubmissions[Timestamp] = TODAY()
)

// 今週の問い合わせ数
ThisWeekSubmissions = 
CALCULATE(
    COUNT(FormSubmissions[SubmissionId]),
    WEEKNUM(FormSubmissions[Timestamp]) = WEEKNUM(TODAY()) &&
    YEAR(FormSubmissions[Timestamp]) = YEAR(TODAY())
)

// 今月の問い合わせ数
ThisMonthSubmissions = 
CALCULATE(
    COUNT(FormSubmissions[SubmissionId]),
    MONTH(FormSubmissions[Timestamp]) = MONTH(TODAY()) &&
    YEAR(FormSubmissions[Timestamp]) = YEAR(TODAY())
)

// 過去30日間の問い合わせ数
Last30DaysSubmissions = 
CALCULATE(
    COUNT(FormSubmissions[SubmissionId]),
    DATESBETWEEN(
        FormSubmissions[Timestamp],
        TODAY() - 30,
        TODAY()
    )
)
```

### 前期比較

```dax
// 前日比
DayOverDayChange = 
VAR Yesterday = 
    CALCULATE(
        COUNT(FormSubmissions[SubmissionId]),
        FormSubmissions[Timestamp] = TODAY() - 1
    )
VAR Today = [TodaySubmissions]
RETURN
    Today - Yesterday

// 前日比率（%）
DayOverDayChangePercent = 
VAR Yesterday = 
    CALCULATE(
        COUNT(FormSubmissions[SubmissionId]),
        FormSubmissions[Timestamp] = TODAY() - 1
    )
VAR Today = [TodaySubmissions]
RETURN
    DIVIDE(Today - Yesterday, Yesterday, 0) * 100

// 前週比
WeekOverWeekChange = 
VAR CurrentWeek = [ThisWeekSubmissions]
VAR LastWeek = 
    CALCULATE(
        COUNT(FormSubmissions[SubmissionId]),
        DATEADD(FormSubmissions[Timestamp], -7, DAY)
    )
RETURN
    CurrentWeek - LastWeek

// 前月比
MonthOverMonthChange = 
VAR CurrentMonth = [ThisMonthSubmissions]
VAR LastMonth = 
    CALCULATE(
        COUNT(FormSubmissions[SubmissionId]),
        DATEADD(FormSubmissions[Timestamp], -1, MONTH)
    )
RETURN
    CurrentMonth - LastMonth
```

### トレンド分析

```dax
// 7日間移動平均
MovingAverage7Days = 
AVERAGEX(
    DATESINPERIOD(
        'Calendar'[Date],
        LASTDATE('Calendar'[Date]),
        -7,
        DAY
    ),
    [TotalSubmissions]
)

// 30日間移動平均
MovingAverage30Days = 
AVERAGEX(
    DATESINPERIOD(
        'Calendar'[Date],
        LASTDATE('Calendar'[Date]),
        -30,
        DAY
    ),
    [TotalSubmissions]
)

// 累積問い合わせ数
CumulativeSubmissions = 
CALCULATE(
    COUNT(FormSubmissions[SubmissionId]),
    FILTER(
        ALL('Calendar'[Date]),
        'Calendar'[Date] <= MAX('Calendar'[Date])
    )
)

// 成長率（月次）
MonthlyGrowthRate = 
VAR CurrentMonthValue = [ThisMonthSubmissions]
VAR PreviousMonthValue = 
    CALCULATE(
        COUNT(FormSubmissions[SubmissionId]),
        DATEADD('Calendar'[Date], -1, MONTH)
    )
RETURN
    DIVIDE(
        CurrentMonthValue - PreviousMonthValue,
        PreviousMonthValue,
        0
    )
```

## 病院分析

### 病院タイプ別分析

```dax
// 病院タイプ別の問い合わせ数
SubmissionsByHospitalType = 
CALCULATE(
    COUNT(FormSubmissions[SubmissionId]),
    ALLEXCEPT(FormSubmissions, FormSubmissions[HospitalType])
)

// 病院規模別の分布
HospitalScaleDistribution = 
SWITCH(
    TRUE(),
    FormSubmissions[StaffCount] < 50, "小規模（50人未満）",
    FormSubmissions[StaffCount] < 100, "中小規模（50-99人）",
    FormSubmissions[StaffCount] < 200, "中規模（100-199人）",
    FormSubmissions[StaffCount] < 500, "大規模（200-499人）",
    "超大規模（500人以上）"
)

// 病院タイプ別の平均スタッフ数
AvgStaffByHospitalType = 
CALCULATE(
    AVERAGE(FormSubmissions[StaffCount]),
    ALLEXCEPT(FormSubmissions, FormSubmissions[HospitalType])
)

// トップ10病院（問い合わせ数）
Top10Hospitals = 
TOPN(
    10,
    SUMMARIZE(
        FormSubmissions,
        FormSubmissions[HospitalName],
        "SubmissionCount", COUNT(FormSubmissions[SubmissionId])
    ),
    [SubmissionCount],
    DESC
)
```

### 地域分析

```dax
// 都道府県の抽出
Prefecture = 
VAR AddressText = FormSubmissions[Address]
VAR PrefectureEnd = 
    MAX(
        FIND("都", AddressText, 1, 0),
        FIND("道", AddressText, 1, 0),
        FIND("府", AddressText, 1, 0),
        FIND("県", AddressText, 1, 0)
    )
RETURN
    IF(PrefectureEnd > 0, LEFT(AddressText, PrefectureEnd), "不明")

// 地域別問い合わせ数
SubmissionsByRegion = 
CALCULATE(
    COUNT(FormSubmissions[SubmissionId]),
    ALLEXCEPT(FormSubmissions, FormSubmissions[Prefecture])
)

// 地域別病院数
HospitalsByRegion = 
CALCULATE(
    DISTINCTCOUNT(FormSubmissions[HospitalName]),
    ALLEXCEPT(FormSubmissions, FormSubmissions[Prefecture])
)
```

## コンバージョン分析

### コンバージョン率

```dax
// 基本コンバージョン率
ConversionRate = 
VAR TotalLeads = COUNT(FormSubmissions[SubmissionId])
VAR Conversions = 
    CALCULATE(
        COUNT(FormSubmissions[SubmissionId]),
        FormSubmissions[Status] = "契約済み"
    )
RETURN
    DIVIDE(Conversions, TotalLeads, 0)

// 病院タイプ別コンバージョン率
ConversionRateByHospitalType = 
VAR TypeLeads = 
    CALCULATE(
        COUNT(FormSubmissions[SubmissionId]),
        ALLEXCEPT(FormSubmissions, FormSubmissions[HospitalType])
    )
VAR TypeConversions = 
    CALCULATE(
        COUNT(FormSubmissions[SubmissionId]),
        FormSubmissions[Status] = "契約済み",
        ALLEXCEPT(FormSubmissions, FormSubmissions[HospitalType])
    )
RETURN
    DIVIDE(TypeConversions, TypeLeads, 0)

// 興味別コンバージョン率
ConversionRateByInterest = 
VAR InterestLeads = 
    CALCULATE(
        COUNT(FormSubmissions[SubmissionId]),
        ALLEXCEPT(FormSubmissions, FormSubmissions[Interest])
    )
VAR InterestConversions = 
    CALCULATE(
        COUNT(FormSubmissions[SubmissionId]),
        FormSubmissions[Status] = "契約済み",
        ALLEXCEPT(FormSubmissions, FormSubmissions[Interest])
    )
RETURN
    DIVIDE(InterestConversions, InterestLeads, 0)
```

### リードスコアリング

```dax
// リードスコア計算
LeadScore = 
VAR StaffScore = 
    SWITCH(
        TRUE(),
        FormSubmissions[StaffCount] >= 500, 10,
        FormSubmissions[StaffCount] >= 200, 8,
        FormSubmissions[StaffCount] >= 100, 6,
        FormSubmissions[StaffCount] >= 50, 4,
        2
    )
VAR InterestScore = 
    SWITCH(
        FormSubmissions[Interest],
        "即導入希望", 10,
        "デモ希望", 8,
        "資料請求", 5,
        "情報収集", 3,
        1
    )
VAR HospitalTypeScore = 
    SWITCH(
        FormSubmissions[HospitalType],
        "大学病院", 10,
        "総合病院", 8,
        "専門病院", 6,
        "クリニック", 4,
        2
    )
RETURN
    (StaffScore + InterestScore + HospitalTypeScore) / 3

// 高スコアリード数
HighScoreLeads = 
CALCULATE(
    COUNT(FormSubmissions[SubmissionId]),
    FILTER(
        FormSubmissions,
        [LeadScore] >= 7
    )
)
```

## 高度な分析

### 予測分析

```dax
// 次月の問い合わせ予測（線形回帰）
NextMonthForecast = 
VAR MonthlyData = 
    SUMMARIZE(
        FormSubmissions,
        "YearMonth", FORMAT(FormSubmissions[Timestamp], "YYYY-MM"),
        "Count", COUNT(FormSubmissions[SubmissionId])
    )
VAR Slope = 
    LINESTX(
        MonthlyData,
        [Count],
        [YearMonth]
    )
VAR Intercept = 
    LINESTX(
        MonthlyData,
        [Count],
        [YearMonth],
        FALSE
    )
VAR NextMonthX = 
    MAX([YearMonth]) + 1
RETURN
    Slope * NextMonthX + Intercept

// 季節性を考慮した予測
SeasonalForecast = 
VAR CurrentMonth = MONTH(TODAY())
VAR HistoricalAverage = 
    CALCULATE(
        AVERAGE(
            SUMMARIZE(
                FormSubmissions,
                "Month", MONTH(FormSubmissions[Timestamp]),
                "Year", YEAR(FormSubmissions[Timestamp]),
                "Count", COUNT(FormSubmissions[SubmissionId])
            )[Count]
        ),
        [Month] = CurrentMonth
    )
VAR GrowthRate = [MonthlyGrowthRate]
RETURN
    HistoricalAverage * (1 + GrowthRate)
```

### 異常検知

```dax
// 標準偏差を使用した異常値検出
AnomalyDetection = 
VAR DailyAverage = 
    AVERAGEX(
        VALUES('Calendar'[Date]),
        [TotalSubmissions]
    )
VAR StandardDev = 
    STDEVX.P(
        VALUES('Calendar'[Date]),
        [TotalSubmissions]
    )
VAR CurrentValue = [TotalSubmissions]
VAR ZScore = 
    DIVIDE(
        CurrentValue - DailyAverage,
        StandardDev,
        0
    )
RETURN
    IF(
        ABS(ZScore) > 2,
        "異常値",
        "正常"
    )

// 移動平均からの乖離率
DeviationFromMA = 
VAR MA30 = [MovingAverage30Days]
VAR CurrentValue = [TotalSubmissions]
RETURN
    DIVIDE(
        CurrentValue - MA30,
        MA30,
        0
    ) * 100
```

### コホート分析

```dax
// コホート別リテンション率
CohortRetention = 
VAR CohortMonth = 
    MINX(
        FILTER(
            FormSubmissions,
            FormSubmissions[HospitalName] = EARLIER(FormSubmissions[HospitalName])
        ),
        FormSubmissions[Timestamp]
    )
VAR MonthsSinceFirst = 
    DATEDIFF(
        CohortMonth,
        FormSubmissions[Timestamp],
        MONTH
    )
RETURN
    CALCULATE(
        DISTINCTCOUNT(FormSubmissions[HospitalName]),
        FILTER(
            ALL(FormSubmissions),
            DATEDIFF(
                CohortMonth,
                FormSubmissions[Timestamp],
                MONTH
            ) = MonthsSinceFirst
        )
    )

// コホート別LTV（Life Time Value）
CohortLTV = 
SUMX(
    FILTER(
        FormSubmissions,
        FormSubmissions[CohortMonth] = EARLIER(FormSubmissions[CohortMonth])
    ),
    FormSubmissions[ContractValue]
)
```

## カスタム計算列

### 日付関連

```dax
// 営業日判定
IsBusinessDay = 
VAR DayOfWeek = WEEKDAY(FormSubmissions[Timestamp], 2)
RETURN
    IF(DayOfWeek <= 5, TRUE, FALSE)

// 四半期
Quarter = 
"Q" & QUARTER(FormSubmissions[Timestamp]) & " " & YEAR(FormSubmissions[Timestamp])

// 会計年度（4月始まり）
FiscalYear = 
IF(
    MONTH(FormSubmissions[Timestamp]) >= 4,
    YEAR(FormSubmissions[Timestamp]),
    YEAR(FormSubmissions[Timestamp]) - 1
)

// 時間帯区分
TimeSlot = 
VAR Hour = HOUR(FormSubmissions[Timestamp])
RETURN
    SWITCH(
        TRUE(),
        Hour < 6, "深夜",
        Hour < 9, "早朝",
        Hour < 12, "午前",
        Hour < 15, "午後前半",
        Hour < 18, "午後後半",
        Hour < 21, "夜間",
        "深夜"
    )
```

### 分類関連

```dax
// 問い合わせ品質スコア
InquiryQualityScore = 
VAR HasEmail = IF(NOT(ISBLANK(FormSubmissions[Email])), 1, 0)
VAR HasPhone = IF(NOT(ISBLANK(FormSubmissions[Phone])), 1, 0)
VAR HasMessage = IF(LEN(FormSubmissions[Message]) > 50, 2, 0)
VAR HasSpecificInterest = 
    IF(FormSubmissions[Interest] IN {"即導入希望", "デモ希望"}, 2, 0)
RETURN
    HasEmail + HasPhone + HasMessage + HasSpecificInterest

// 緊急度分類
UrgencyLevel = 
SWITCH(
    TRUE(),
    CONTAINSSTRING(FormSubmissions[Message], "至急") || 
    CONTAINSSTRING(FormSubmissions[Message], "緊急"), "高",
    FormSubmissions[Interest] = "即導入希望", "高",
    FormSubmissions[Interest] = "デモ希望", "中",
    "低"
)

// レスポンス必要時間
RequiredResponseTime = 
SWITCH(
    [UrgencyLevel],
    "高", "1時間以内",
    "中", "24時間以内",
    "低", "3営業日以内"
)
```

## パフォーマンス最適化されたメジャー

### 変数を活用した効率的なメジャー

```dax
// 複合KPIダッシュボード
DashboardKPIs = 
VAR TotalCount = COUNT(FormSubmissions[SubmissionId])
VAR UniqueHospitals = DISTINCTCOUNT(FormSubmissions[HospitalName])
VAR AvgStaff = AVERAGE(FormSubmissions[StaffCount])
VAR ConversionCount = 
    CALCULATE(
        COUNT(FormSubmissions[SubmissionId]),
        FormSubmissions[Status] = "契約済み"
    )
VAR ConversionRate = DIVIDE(ConversionCount, TotalCount, 0)
RETURN
    "総数: " & TotalCount & 
    " | 病院数: " & UniqueHospitals & 
    " | 平均規模: " & ROUND(AvgStaff, 0) & 
    " | CV率: " & FORMAT(ConversionRate, "0.0%")

// 効率的な期間比較
PeriodComparison = 
VAR CurrentPeriod = [ThisMonthSubmissions]
VAR PreviousPeriod = 
    CALCULATE(
        [ThisMonthSubmissions],
        DATEADD('Calendar'[Date], -1, MONTH)
    )
VAR Change = CurrentPeriod - PreviousPeriod
VAR ChangePercent = DIVIDE(Change, PreviousPeriod, 0)
RETURN
    SWITCH(
        TRUE(),
        ChangePercent > 0.1, "大幅増加 (+" & FORMAT(ChangePercent, "0.0%") & ")",
        ChangePercent > 0, "増加 (+" & FORMAT(ChangePercent, "0.0%") & ")",
        ChangePercent < -0.1, "大幅減少 (" & FORMAT(ChangePercent, "0.0%") & ")",
        ChangePercent < 0, "減少 (" & FORMAT(ChangePercent, "0.0%") & ")",
        "変化なし"
    )
```

### インデックス活用メジャー

```dax
// 高速ランキング計算
FastRanking = 
VAR CurrentHospital = FormSubmissions[HospitalName]
VAR CurrentCount = 
    CALCULATE(
        COUNT(FormSubmissions[SubmissionId]),
        FormSubmissions[HospitalName] = CurrentHospital
    )
RETURN
    RANKX(
        ALL(FormSubmissions[HospitalName]),
        CALCULATE(COUNT(FormSubmissions[SubmissionId])),
        CurrentCount,
        DESC,
        DENSE
    )

// 効率的なトップN計算
EfficientTopN = 
VAR TopHospitals = 
    TOPN(
        10,
        ADDCOLUMNS(
            VALUES(FormSubmissions[HospitalName]),
            "@Count", CALCULATE(COUNT(FormSubmissions[SubmissionId]))
        ),
        [@Count],
        DESC
    )
RETURN
    CONCATENATEX(
        TopHospitals,
        FormSubmissions[HospitalName] & ": " & [@Count],
        UNICHAR(10),
        [@Count],
        DESC
    )
```

## 使用上の注意

1. **パフォーマンス**: 大量のデータを扱う場合は、計算列よりもメジャーを使用することを推奨
2. **コンテキスト**: フィルターコンテキストに注意し、必要に応じて ALL() や ALLEXCEPT() を使用
3. **データ型**: 計算前にデータ型が正しいことを確認
4. **エラー処理**: DIVIDE() 関数を使用してゼロ除算エラーを回避

## 参考情報

- [DAX ガイド](https://dax.guide/)
- [SQLBI DAX Patterns](https://www.daxpatterns.com/)
- [Microsoft DAX リファレンス](https://docs.microsoft.com/ja-jp/dax/)