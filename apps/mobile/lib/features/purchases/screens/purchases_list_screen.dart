import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../data/purchase.dart';
import '../data/purchases_api.dart';
import '../widgets/purchase_status_chip.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_indicator.dart';

/// Mirrors apps/web/src/app/(consumer)/purchases/page.tsx
/// Read-only — checkout isn't built in the app yet, so this only lists
/// what was bought on web.
class PurchasesListScreen extends StatefulWidget {
  const PurchasesListScreen({super.key});

  @override
  State<PurchasesListScreen> createState() => _PurchasesListScreenState();
}

class _PurchasesListScreenState extends State<PurchasesListScreen> {
  late Future<List<Purchase>> _future;

  @override
  void initState() {
    super.initState();
    _future = PurchasesApi.fetchMyPurchases();
  }

  Future<void> _refresh() async {
    final next = PurchasesApi.fetchMyPurchases();
    setState(() => _future = next);
    await next;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Purchases')),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<List<Purchase>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const LoadingIndicator();
            }
            if (snapshot.hasError) {
              return ListView(
                children: [
                  const SizedBox(height: 80),
                  EmptyState(
                    icon: Icons.error_outline,
                    message: 'Could not load purchases.\n${snapshot.error}',
                  ),
                ],
              );
            }
            final purchases = snapshot.data ?? [];
            if (purchases.isEmpty) {
              return ListView(
                children: const [
                  SizedBox(height: 80),
                  EmptyState(
                    icon: Icons.shopping_bag_outlined,
                    message: "You haven't purchased anything yet.",
                  ),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: purchases.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, i) {
                final p = purchases[i];
                return Card(
                  clipBehavior: Clip.antiAlias,
                  child: ListTile(
                    leading: p.imageUrl.isEmpty
                        ? null
                        : ClipRRect(
                            borderRadius: BorderRadius.circular(6),
                            child: Image.network(
                              p.imageUrl,
                              width: 56,
                              height: 56,
                              fit: BoxFit.cover,
                            ),
                          ),
                    title: Text(p.name, maxLines: 1, overflow: TextOverflow.ellipsis),
                    subtitle: Row(
                      children: [
                        PurchaseStatusChip(status: p.status),
                        if (p.priceInRupeesPaid != null) ...[
                          const SizedBox(width: 8),
                          Text('Rs. ${p.priceInRupeesPaid}'),
                        ],
                      ],
                    ),
                    onTap: p.status == PurchaseStatus.completed
                        ? () => context.push('/courses/${p.productId}')
                        : () => context.push('/purchases/${p.id}'),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}